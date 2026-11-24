export function createRequestLimiter(limit = 3) {
  let active = 0
  const queue = []
  function next() {
    while (active < limit && queue.length) queue.shift()()
  }
  return (action, signal) =>
    new Promise((resolve, reject) => {
      const abort = () => {
        const index = queue.indexOf(start)
        if (index >= 0) queue.splice(index, 1)
        reject(Object.assign(new Error('Canceled'), { code: 'ERR_CANCELED' }))
      }
      const start = () => {
        signal?.removeEventListener('abort', abort)
        if (signal?.aborted) {
          abort()
          return
        }
        active++
        Promise.resolve()
          .then(action)
          .then(resolve, reject)
          .finally(() => {
            active--
            next()
          })
      }
      if (signal?.aborted) {
        abort()
        return
      }
      signal?.addEventListener('abort', abort, { once: true })
      queue.push(start)
      next()
    })
}

export const limitTaskRead = createRequestLimiter(3)

// Publish only a complete project snapshot, never a successfully fetched prefix.
export async function loadTaskCollection(
  api,
  projectId,
  signal,
  limit = limitTaskRead,
) {
  const rows = new Map()
  let expected, pages
  for (let index = 0; index === 0 || index < pages; index++) {
    const page = await limit(
      () =>
        api.list(
          projectId,
          {
            page: index,
            size: 100,
            sort: 'createdAt,desc',
            search: '',
            status: '',
            priority: '',
          },
          signal,
        ),
      signal,
    )
    if (
      !Number.isInteger(page.totalElements) ||
      page.totalElements < 0 ||
      !Number.isInteger(page.totalPages) ||
      page.totalPages !== Math.ceil(page.totalElements / 100) ||
      !Array.isArray(page.content) ||
      (index && page.totalElements !== expected)
    )
      throw new Error('Inconsistent task collection')
    expected = page.totalElements
    pages = page.totalPages
    for (const task of page.content) {
      if (!task.id || task.projectId !== projectId)
        throw new Error('Invalid task scope')
      rows.set(task.id, task)
    }
  }
  if (rows.size !== expected)
    throw new Error('Task collection changed while paging')
  return { content: [...rows.values()], totalElements: expected }
}
