import { test, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { QueryObserver } from '@tanstack/react-query'
import {
  queryClient as client,
  scopedKey,
  pendingWrites,
  readBlocked,
} from '../src/query/client.js'
import { keys } from '../src/query/keys.js'
import {
  findTask,
  withTaskCache,
  withProjectCache,
} from '../src/query/mutations.js'
import { resourceState } from '../src/query/resourceState.js'
import { orderedTasks } from '../src/components/kanban/kanbanModel.js'
import { setAccessToken, clearAccessToken } from '../src/api/tokenStore.js'

// No wall-clock GC timers in Node; cases clear their cache explicitly.
client.setDefaultOptions({
  ...client.getDefaultOptions(),
  queries: { ...client.getDefaultOptions().queries, gcTime: Infinity },
})

const task = (id, status = 'TODO', extra = {}) => ({
  id,
  projectId: 'p1',
  title: `Task ${id}`,
  status,
  priority: 'HIGH',
  createdAt: '2026-11-23T10:00:00Z',
  completedAt: null,
  ...extra,
})
const page = (content, total = content.length, size = 20) => ({
  content,
  totalElements: total,
  totalPages: Math.ceil(total / size),
  page: 0,
  size,
})
const put = (key, value) => client.setQueryData(scopedKey(key), value)
const get = (key) => client.getQueryData(scopedKey(key))
const state = (key) => client.getQueryState(scopedKey(key))
const board = (status, search = '', priority = '') =>
  keys.board('p1', status, search, priority)
const list = (extra = {}) =>
  keys.tasks('p1', { page: 0, size: 10, sort: 'createdAt,desc', ...extra })
const seedBoard = (
  rows,
  total = rows.length,
  status = 'TODO',
  search = '',
  priority = '',
) =>
  put(board(status, search, priority), {
    pages: [page(rows, total)],
    pageParams: [0],
  })
const deferred = () => {
  let resolve, reject
  const promise = new Promise((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
const tick = () => new Promise((resolve) => setImmediate(resolve))
beforeEach(() => {
  clearAccessToken()
  setAccessToken('test-session')
  client.clear()
})
afterEach(() => {
  clearAccessToken()
  client.clear()
})

test('status immediately updates both columns, counts and task list; reconciles actual timestamps with no GET', async () => {
  const first = task('a'),
    response = deferred()
  seedBoard([first])
  seedBoard([], 0, 'DONE')
  put(list(), page([first], 1, 10))
  const api = withTaskCache({ status: () => response.promise })
  const request = api.status('a', 'DONE')
  await tick()
  assert.equal(get(board('TODO')).pages[0].totalElements, 0)
  assert.equal(get(board('DONE')).pages[0].totalElements, 1)
  assert.equal(get(list()).content[0].status, 'DONE')
  assert.equal(get(board('DONE')).pages[0].content[0].completedAt, null)
  response.resolve({
    ...first,
    status: 'DONE',
    completedAt: '2026-11-23T11:00:00Z',
  })
  await request
  assert.equal(findTask('a').completedAt, '2026-11-23T11:00:00Z')
  assert.equal(state(board('TODO')).isInvalidated, false)
  assert.equal(state(board('DONE')).isInvalidated, false)
  assert.equal(state(list()).isInvalidated, false)
})

test('different task writes run concurrently; failure rolls back only that task', async () => {
  const a = task('a'),
    b = task('b'),
    first = deferred(),
    second = deferred()
  seedBoard([a, b])
  seedBoard([], 0, 'DONE')
  put(list(), page([a, b], 2, 10))
  const api = withTaskCache({
    status: (id) => (id === 'a' ? first.promise : second.promise),
  })
  const one = api.status('a', 'DONE')
  const rejected = assert.rejects(one, /conflict/)
  const two = api.status('b', 'DONE')
  await tick()
  assert.equal(pendingWrites.size, 2)
  second.resolve({ ...b, status: 'DONE', completedAt: 'server' })
  await two
  first.reject(new Error('conflict'))
  await rejected
  assert.deepEqual(
    get(board('TODO')).pages[0].content.map((row) => row.id),
    ['a'],
  )
  assert.deepEqual(
    get(board('DONE')).pages[0].content.map((row) => row.id),
    ['b'],
  )
  assert.equal(get(board('DONE')).pages[0].totalElements, 1)
  assert.deepEqual(
    get(list()).content.map((row) => row.status),
    ['TODO', 'DONE'],
  )
})

test('same-task conflicting requests are rejected and unchanged status sends no PATCH', async () => {
  const a = task('a'),
    response = deferred()
  let calls = 0
  seedBoard([a])
  const api = withTaskCache({
    status: () => {
      calls++
      return response.promise
    },
  })
  await api.status('a', 'TODO')
  assert.equal(calls, 0)
  const first = api.status('a', 'DONE')
  await tick()
  await assert.rejects(api.status('a', 'IN_PROGRESS'), { code: 'ERR_CANCELED' })
  response.resolve({ ...a, status: 'DONE' })
  await first
  assert.equal(calls, 1)
})

test('filtered pagination removes matching row and marks gaps stale without inserting into unknown sorted pages', async () => {
  const a = task('a'),
    rows = Array.from({ length: 20 }, (_, i) => task(`r${i}`))
  seedBoard([a, ...rows.slice(0, 19)], 50)
  const filtered = list({ status: 'TODO', page: 2 })
  put(filtered, page([a], 21, 10))
  const done = list({ status: 'DONE', page: 2 })
  put(done, page([], 20, 10))
  const api = withTaskCache({ status: async () => ({ ...a, status: 'DONE' }) })
  await api.status('a', 'DONE')
  assert.equal(get(board('TODO')).pages[0].totalElements, 49)
  assert.equal(state(board('TODO')).isInvalidated, true)
  assert.deepEqual(get(filtered).content, [])
  assert.deepEqual(get(done).content, [])
  assert.equal(get(done).totalElements, 21)
  assert.equal(state(done).isInvalidated, true)
  assert.equal(get(filtered).page, 0) // Response metadata is preserved, never synthesizes another page.
})

test('priority/search filters do not receive nonmatching tasks', async () => {
  const a = task('a')
  seedBoard([a])
  seedBoard([], 0, 'DONE', 'different')
  seedBoard([], 0, 'DONE', '', 'LOW')
  await withTaskCache({
    status: async () => ({ ...a, status: 'DONE' }),
  }).status('a', 'DONE')
  assert.equal(get(board('DONE', 'different')).pages[0].totalElements, 0)
  assert.equal(get(board('DONE', '', 'LOW')).pages[0].totalElements, 0)
})

test('CRUD uses actual response, invalidates affected dashboards and leaves unrelated project data alone', async () => {
  const a = task('a')
  seedBoard([a])
  put(list(), page([a], 1, 10))
  put(keys.summary(), { totalTasks: 1 })
  put(keys.summary('p1'), { totalTasks: 1 })
  put(keys.summary('p2'), { totalTasks: 5 })
  put(keys.upcoming(0), page([a]))
  put(keys.tasks('p2', {}), page([task('z', 'TODO', { projectId: 'p2' })]))
  const api = withTaskCache({
    update: async () => ({ ...a, title: 'Updated server title' }),
    remove: async () => {},
  })
  await api.update('a', { projectId: 'p1' })
  assert.equal(get(list()).content[0].title, 'Updated server title')
  assert.equal(state(keys.summary()).isInvalidated, true)
  assert.equal(state(keys.summary('p1')).isInvalidated, true)
  assert.equal(state(keys.summary('p2')).isInvalidated, false)
  assert.equal(state(keys.upcoming(0)).isInvalidated, true)
  assert.deepEqual(get(keys.summary()), { totalTasks: 1 })
  await api.remove('a')
  assert.equal(get(list()).totalElements, 0)
  assert.equal(get(keys.task('a')), undefined)
  assert.equal(get(keys.tasks('p2', {})).content.length, 1)
})

test('create preserves sorted page contents and marks only affected pages for background revalidation', async () => {
  const a = task('a'),
    added = task('new')
  put(list(), page([a], 1, 10))
  seedBoard([a])
  await withTaskCache({ create: async () => added }).create({ projectId: 'p1' })
  assert.deepEqual(
    get(list()).content.map((row) => row.id),
    ['a'],
  )
  assert.equal(get(list()).totalElements, 2)
  assert.equal(state(list()).isInvalidated, true)
  assert.equal(get(keys.task('new')).id, 'new')
})

test('project edit/archive update catalog and existing pages; deletion evicts dependent tasks', async () => {
  const p = { id: 'p1', status: 'ACTIVE', name: 'Before' },
    other = { id: 'p2', status: 'ACTIVE' }
  put(keys.catalog, [p, other])
  put(keys.projects(0), page([p, other], 2, 9))
  seedBoard([task('a')])
  put(keys.task('a'), task('a'))
  const api = withProjectCache({
    update: async () => ({ ...p, name: 'After' }),
    archive: async () => ({ ...p, name: 'After', status: 'ARCHIVED' }),
    remove: async () => {},
  })
  await api.update('p1', {})
  assert.equal(get(keys.catalog)[0].name, 'After')
  assert.equal(state(keys.projects(0)).isInvalidated, false)
  await api.archive('p1')
  assert.equal(get(keys.catalog)[0].status, 'ARCHIVED')
  await api.remove('p1')
  assert.deepEqual(get(keys.catalog), [other])
  assert.equal(get(keys.projects(0)).totalElements, 1)
  assert.equal(get(board('TODO')), undefined)
  assert.equal(get(keys.task('a')), undefined)
})

test('logout/account change clears cache, aborts pending writes and ignores late responses', async () => {
  const a = task('a'),
    response = deferred()
  seedBoard([a])
  put(keys.user, { id: 'user-one' })
  let signal
  const request = withTaskCache({
    status: (_id, _status, supplied) => {
      signal = supplied
      return response.promise
    },
  }).status('a', 'DONE')
  const rejected = assert.rejects(request, { code: 'ERR_CANCELED' })
  await tick()
  const previousKey = scopedKey(keys.user)
  setAccessToken('another-session')
  assert.equal(signal.aborted, true)
  assert.equal(client.getQueryCache().getAll().length, 0)
  assert.notDeepEqual(scopedKey(keys.user), previousKey)
  response.resolve({ ...a, status: 'DONE' })
  await rejected
  assert.equal(client.getQueryCache().getAll().length, 0)
  assert.equal(pendingWrites.size, 0)
})

test('cached resource retains success/content during background loading and errors', () => {
  const data = page([task('a')])
  const loading = resourceState({ data, isFetching: true, isError: false })
  assert.equal(loading.status, 'success')
  assert.equal(loading.data, data)
  const error = new Error('network')
  const failed = resourceState({
    data,
    error,
    isError: true,
    isFetching: false,
  })
  assert.equal(failed.status, 'success')
  assert.equal(failed.backgroundError, error)
  assert.equal(
    resourceState({ data: undefined, isFetching: true }).status,
    'loading',
  )
})

test('identical reads deduplicate and reuse fresh data across observers; writes block obsolete reads', async () => {
  let calls = 0
  const options = {
    queryKey: scopedKey(keys.catalog),
    queryFn: async () => {
      calls++
      return []
    },
  }
  await Promise.all([client.fetchQuery(options), client.fetchQuery(options)])
  const observer = new QueryObserver(client, options)
  const unsubscribe = observer.subscribe(() => {})
  await tick()
  assert.equal(calls, 1)
  unsubscribe()
  observer.destroy()
  const a = task('a'),
    response = deferred()
  seedBoard([a])
  const request = withTaskCache({ status: () => response.promise }).status(
    'a',
    'DONE',
  )
  await tick()
  assert.equal(readBlocked(board('TODO')), true)
  assert.equal(readBlocked(keys.tasks('p2', {})), false)
  response.resolve({ ...a, status: 'DONE' })
  await request
  assert.equal(readBlocked(board('TODO')), false)
})

test('late GET cannot repopulate cache after logout', async () => {
  const response = deferred()
  const promise = client.fetchQuery({
    queryKey: scopedKey(keys.user),
    queryFn: () => response.promise,
  })
  const rejected = assert.rejects(promise)
  clearAccessToken()
  response.resolve({ id: 'old-user' })
  await rejected
  await tick()
  assert.equal(client.getQueryCache().getAll().length, 0)
})

test('partial destination never inserts an older task outside its known sorted prefix', async () => {
  const a = task('a', 'TODO', { createdAt: '2020-01-01T00:00:00Z' })
  seedBoard([a])
  seedBoard([task('newer', 'DONE')], 50, 'DONE')
  await withTaskCache({
    status: async () => ({ ...a, status: 'DONE' }),
  }).status('a', 'DONE')
  assert.deepEqual(
    get(board('DONE')).pages[0].content.map((row) => row.id),
    ['newer'],
  )
  assert.equal(get(board('DONE')).pages[0].totalElements, 51)
  assert.equal(state(board('DONE')).isInvalidated, true)
})

test('project create updates complete catalog, retains sorted page and preserves stale state across edits', async () => {
  const p = { id: 'p1', status: 'ACTIVE' },
    added = { id: 'p2', status: 'ACTIVE' }
  put(keys.catalog, [p])
  put(keys.projects(0), page([p], 1, 9))
  const api = withProjectCache({
    create: async () => added,
    update: async () => ({ ...p, name: 'Updated' }),
  })
  await api.create({})
  assert.equal(get(keys.catalog).length, 2)
  assert.deepEqual(get(keys.projects(0)).content, [p])
  await api.update('p1', {})
  assert.equal(state(keys.projects(0)).isInvalidated, true)
})

test('Kanban sorting compares timestamps with differing fractional precision correctly', () => {
  const older = task('a', 'TODO', { createdAt: '2026-11-23T10:00:00Z' })
  const newer = task('z', 'TODO', { createdAt: '2026-11-23T10:00:00.123Z' })
  assert.deepEqual(
    orderedTasks([older, newer]).map((row) => row.id),
    ['z', 'a'],
  )
  const microsecond = task('zz', 'TODO', {
    createdAt: '2026-11-23T10:00:00.123001Z',
  })
  assert.deepEqual(
    orderedTasks([newer, microsecond]).map((row) => row.id),
    ['zz', 'z'],
  )
})

test('complete project snapshots stay consistent through optimistic status, rollback, moves, creation and deletion', async () => {
  const a = task('a')
  put(keys.collection('p1'), { content: [a], totalElements: 1 })
  put(keys.collection('p2'), { content: [], totalElements: 0 })
  const response = deferred()
  const request = withTaskCache({ status: () => response.promise }).status(
    'a',
    'DONE',
  )
  const rejection = assert.rejects(request, /failed/)
  await tick()
  assert.equal(get(keys.collection('p1')).content[0].status, 'DONE')
  response.reject(new Error('failed'))
  await rejection
  assert.equal(get(keys.collection('p1')).content[0].status, 'TODO')
  const api = withTaskCache({
    update: async () => ({ ...a, projectId: 'p2' }),
    create: async () => task('b', 'TODO', { projectId: 'p2' }),
    remove: async () => {},
  })
  await api.update('a', { projectId: 'p2' })
  assert.equal(get(keys.collection('p1')).totalElements, 0)
  assert.equal(get(keys.collection('p2')).content[0].projectId, 'p2')
  await api.create({ projectId: 'p2' })
  assert.equal(get(keys.collection('p2')).totalElements, 2)
  await api.remove('a')
  assert.deepEqual(
    get(keys.collection('p2')).content.map((row) => row.id),
    ['b'],
  )
})
