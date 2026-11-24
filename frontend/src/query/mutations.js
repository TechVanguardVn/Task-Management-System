import {
  queryClient,
  scopedKey,
  sessionGeneration,
  pendingWrites,
  publishCache,
  readBlocked,
} from './client.js'
import { keys } from './keys.js'
import { orderedTasks } from '../components/kanban/kanbanModel.js'

const queries = () =>
  queryClient.getQueryCache().findAll({ queryKey: scopedKey([]) })
const domain = (query) => query.queryKey.slice(2)
const canceled = () =>
  Object.assign(new Error('Canceled'), { code: 'ERR_CANCELED' })
export function findTask(id) {
  for (const query of queries().sort(
    (a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt,
  )) {
    const key = domain(query)
    if (key[0] !== 'tasks') continue
    const data = query.state.data
    const task =
      key[1] === 'detail'
        ? data
        : (
            data?.pages?.flatMap((page) => page.content) ||
            data?.content ||
            []
          ).find((item) => item.id === id)
    if (task?.id === id) return task
  }
}
function matches(task, projectId, filter) {
  return Boolean(
    task &&
    task.projectId === projectId &&
    (!filter.status || task.status === filter.status) &&
    (!filter.priority || task.priority === filter.priority) &&
    (!filter.search ||
      task.title.toLowerCase().includes(filter.search.toLowerCase())),
  )
}
function stale(query) {
  void queryClient.invalidateQueries({
    queryKey: query.queryKey,
    exact: true,
    refetchType: 'none',
  })
}
function updatePage(query, data) {
  const invalidated = query.state.isInvalidated
  queryClient.setQueryData(query.queryKey, data)
  if (invalidated) stale(query)
}

// Apply one entity's delta; never restore a whole cache snapshot over concurrent writes.
export function taskDelta(before, after, positions = new Map()) {
  const id = after?.id || before?.id
  for (const query of queries()) {
    const key = domain(query),
      data = query.state.data
    if (!data || key[0] !== 'tasks') continue
    if (key[1] === 'detail') {
      if (key[2] === id && after)
        queryClient.setQueryData(query.queryKey, after)
      continue
    }
    const [, kind, projectId, filter] = key
    if (kind === 'collection') {
      if (before?.projectId === projectId || after?.projectId === projectId) {
        const content = data.content.filter((task) => task.id !== id)
        if (after?.projectId === projectId) content.push(after)
        updatePage(query, { ...data, content, totalElements: content.length })
      }
      continue
    }
    const was = matches(before, projectId, filter),
      is = matches(after, projectId, filter)
    if (!was && !is) continue
    const delta = Number(is) - Number(was)
    if (kind === 'board') {
      const rows = data.pages.flatMap((page) => page.content)
      const complete = rows.length >= data.pages[0].totalElements
      const remaining = rows.filter((task) => task.id !== id)
      const present = rows.some((task) => task.id === id)
      // A partial prefix can accept only a row whose sorted position is known.
      if (
        is &&
        (present ||
          complete ||
          (rows.length && orderedTasks([after, rows.at(-1)])[0].id === id))
      )
        remaining.push(after)
      const total = Math.max(0, data.pages[0].totalElements + delta)
      const size = data.pages[0].size || 20
      const sorted = orderedTasks(remaining).slice(0, data.pages.length * size)
      updatePage(query, {
        ...data,
        pages: data.pages.map((page, index) => ({
          ...page,
          content: sorted.slice(index * size, (index + 1) * size),
          totalElements: total,
          totalPages: Math.ceil(total / size),
        })),
      })
      if (!complete && (delta || !present || sorted.length < rows.length))
        stale(query)
    } else if (kind === 'list') {
      const index = data.content.findIndex((task) => task.id === id)
      if (index >= 0 && !positions.has(query.queryHash))
        positions.set(query.queryHash, index)
      let content = data.content.filter((task) => task.id !== id)
      if (is && index >= 0) content.splice(index, 0, after)
      else if (is && positions.has(query.queryHash))
        content.splice(
          Math.min(positions.get(query.queryHash), content.length),
          0,
          after,
        )
      updatePage(query, {
        ...data,
        content,
        totalElements: Math.max(0, data.totalElements + delta),
        totalPages: Math.ceil(
          Math.max(0, data.totalElements + delta) / filter.size,
        ),
      })
      const sortField = (filter.sort || '').split(',')[0]
      if (delta || (before && after && before[sortField] !== after[sortField]))
        stale(query)
    }
  }
}
function invalidateDashboard(projects) {
  for (const query of queries()) {
    const key = domain(query)
    if (key[0] !== 'dashboard') continue
    const projectId = key[1] === 'summary' ? key[2] : key[2]?.projectId
    if (!projects.length || !projectId || projects.includes(projectId))
      stale(query)
  }
}
async function writeEntity(kind, id, projects, signal, perform) {
  const lock = `${kind}:${id}`
  if (
    pendingWrites.has(lock) ||
    (kind === 'task' &&
      [...pendingWrites.values()].some((write) => write.kind === 'project')) ||
    (kind === 'project' &&
      [...pendingWrites.values()].some((write) => write.projects.includes(id)))
  )
    throw canceled()
  const generation = sessionGeneration()
  const controller = new AbortController()
  const abort = () => controller.abort()
  signal?.addEventListener('abort', abort, { once: true })
  if (signal?.aborted) controller.abort()
  pendingWrites.set(lock, { id, kind, projects, controller })
  publishCache()
  await queryClient.cancelQueries({
    predicate: (query) => readBlocked(domain(query)),
  })
  try {
    if (controller.signal.aborted) throw canceled()
    return await perform(
      controller.signal,
      () => generation === sessionGeneration(),
    )
  } finally {
    signal?.removeEventListener('abort', abort)
    if (generation === sessionGeneration()) {
      pendingWrites.delete(lock)
      publishCache()
      // Disabled observers resume; active stale queries refetch without clearing their data.
      void queryClient.refetchQueries({
        type: 'active',
        stale: true,
        predicate: (query) =>
          query.state.isInvalidated && !readBlocked(domain(query)),
      })
    }
  }
}
export function withTaskCache(api) {
  async function mutate(action, id, body, signal) {
    const old = findTask(id)
    if (action === 'status' && old?.status === body) return old
    const projects = [
      ...new Set([old?.projectId, body?.projectId].filter(Boolean)),
    ]
    return writeEntity(
      'task',
      id || `new:${body.projectId}`,
      projects,
      signal,
      async (requestSignal, current) => {
        const positions = new Map()
        const optimistic =
          action === 'status' && old ? { ...old, status: body } : null
        if (optimistic) taskDelta(old, optimistic, positions)
        try {
          const result =
            action === 'create'
              ? await api.create(body, requestSignal)
              : action === 'remove'
                ? await api.remove(id, requestSignal)
                : await api[action](id, body, requestSignal)
          if (!current()) throw canceled()
          const actual = action === 'remove' ? null : result
          taskDelta(optimistic || old, actual, positions)
          if (actual)
            queryClient.setQueryData(scopedKey(keys.task(actual.id)), actual)
          else
            queryClient.removeQueries({
              queryKey: scopedKey(keys.task(id)),
              exact: true,
            })
          if (!old && action !== 'create') {
            for (const query of queries())
              if (domain(query)[0] === 'tasks') stale(query)
          }
          invalidateDashboard(
            projects.length ? projects : [actual?.projectId].filter(Boolean),
          )
          return result
        } catch (error) {
          if (current() && optimistic) taskDelta(optimistic, old, positions)
          // A timeout/cancel may happen after the server committed. Reconcile affected data.
          if (current()) {
            for (const query of queries()) {
              const key = domain(query)
              if (
                key[0] === 'tasks' &&
                (key[2] === id || projects.includes(key[2]))
              )
                stale(query)
            }
            invalidateDashboard(projects)
          }
          throw error
        }
      },
    )
  }
  return {
    ...api,
    create: (body, signal) => mutate('create', null, body, signal),
    update: (id, body, signal) => mutate('update', id, body, signal),
    status: (id, status, signal) => mutate('status', id, status, signal),
    remove: (id, signal) => mutate('remove', id, null, signal),
  }
}
export function withProjectCache(api) {
  async function mutate(action, id, body, signal) {
    return writeEntity(
      'project',
      id || 'new',
      [id],
      signal,
      async (requestSignal, current) => {
        try {
          const result =
            action === 'create'
              ? await api.create(body, requestSignal)
              : action === 'update'
                ? await api.update(id, body, requestSignal)
                : await api[action](id, requestSignal)
          if (!current()) throw canceled()
          for (const query of queries()) {
            const key = domain(query),
              data = query.state.data
            if (key[0] === 'projects' && data) {
              if (key[1] === 'catalog')
                queryClient.setQueryData(
                  query.queryKey,
                  action === 'remove'
                    ? data.filter((item) => item.id !== id)
                    : action === 'create'
                      ? [result, ...data]
                      : data.map((item) => (item.id === id ? result : item)),
                )
              else if (key[1] === 'page') {
                const total = Math.max(
                  0,
                  data.totalElements +
                    (action === 'create' ? 1 : action === 'remove' ? -1 : 0),
                )
                updatePage(query, {
                  ...data,
                  totalElements: total,
                  totalPages: Math.ceil(total / key[2].size),
                  content:
                    action === 'remove'
                      ? data.content.filter((item) => item.id !== id)
                      : data.content.map((item) =>
                          item.id === id ? result : item,
                        ),
                })
                if (action === 'remove' || action === 'create') stale(query)
              }
            }
            if (
              action === 'remove' &&
              key[0] === 'tasks' &&
              (key[2] === id || (key[1] === 'detail' && data?.projectId === id))
            )
              queryClient.removeQueries({
                queryKey: query.queryKey,
                exact: true,
              })
          }
          if (action === 'remove') invalidateDashboard([id])
          return result
        } catch (error) {
          if (current()) {
            for (const query of queries()) {
              if (domain(query)[0] === 'projects') stale(query)
              if (
                action === 'remove' &&
                domain(query)[0] === 'tasks' &&
                (domain(query)[2] === id || query.state.data?.projectId === id)
              )
                stale(query)
            }
            if (action === 'remove') invalidateDashboard([id])
          }
          throw error
        }
      },
    )
  }
  return {
    ...api,
    create: (body, signal) => mutate('create', null, body, signal),
    update: (id, body, signal) => mutate('update', id, body, signal),
    archive: (id, signal) => mutate('archive', id, null, signal),
    remove: (id, signal) => mutate('remove', id, null, signal),
  }
}
