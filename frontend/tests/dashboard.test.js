import assert from 'node:assert/strict'
import test from 'node:test'
import { createDashboardApi } from '../src/api/dashboardRequests.js'
import { startReadResource } from '../src/hooks/readResource.js'
import {
  distribution,
  formatDueDate,
  formatPercent,
  greetingAt,
  shortName,
} from '../src/components/dashboard/presentation.js'

// Isolated contract fixtures. No sample business data is bundled in the app.
const summary = {
  totalTasks: 7,
  todoTasks: 2,
  inProgressTasks: 3,
  doneTasks: 2,
  completionPercentage: 28.57,
}
const emptyPage = {
  content: [],
  page: 0,
  size: 4,
  totalElements: 0,
  totalPages: 0,
}

test('requests the documented endpoints and exact pagination parameters in parallel', async () => {
  const requests = []
  const controller = new AbortController()
  const api = createDashboardApi({
    get: async (path, config) => {
      requests.push({ path, ...config })
      return { data: path.endsWith('/summary') ? summary : emptyPage }
    },
  })
  const result = await Promise.all([
    api.summary(controller.signal),
    api.upcoming(1, controller.signal),
    api.overdue(2, controller.signal),
    api.projects(controller.signal),
  ])
  assert.equal(result[0], summary)
  assert.deepEqual(
    requests.map(({ path }) => path),
    [
      '/api/dashboard/summary',
      '/api/dashboard/upcoming',
      '/api/dashboard/overdue',
      '/api/projects',
    ],
  )
  assert.deepEqual(
    requests.slice(1).map(({ params }) => params),
    [
      { page: 1, size: 4 },
      { page: 2, size: 4 },
      { page: 0, size: 4 },
    ],
  )
  assert.ok(requests.every(({ signal }) => signal === controller.signal))
})

test('preserves the backend completion percentage rather than inferring another value', async () => {
  const api = createDashboardApi({ get: async () => ({ data: summary }) })
  assert.equal((await api.summary()).completionPercentage, 28.57)
  assert.equal(formatPercent(summary.completionPercentage), '28,57%')
})

test('accepts a real zero-task summary and empty pages', async () => {
  const zero = {
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    doneTasks: 0,
    completionPercentage: 0,
  }
  const api = createDashboardApi({
    get: async (path) => ({
      data: path.endsWith('/summary') ? zero : emptyPage,
    }),
  })
  assert.equal((await api.summary()).totalTasks, 0)
  assert.deepEqual(await api.upcoming(0), emptyPage)
  assert.ok(distribution(zero).every(({ percentage }) => percentage === 0))
})

test('rejects missing, inconsistent, negative and invalid summary fields instead of inventing zeros', async () => {
  for (const data of [
    null,
    {},
    { ...summary, totalTasks: 99 },
    { ...summary, totalTasks: -1 },
    { ...summary, doneTasks: 0.5 },
    { ...summary, completionPercentage: 101 },
    { ...summary, completionPercentage: '28.57' },
  ]) {
    const api = createDashboardApi({ get: async () => ({ data }) })
    await assert.rejects(api.summary())
  }
})

test('rejects invalid page envelopes', async () => {
  for (const data of [
    {},
    { ...emptyPage, content: null },
    { ...emptyPage, totalElements: -1 },
  ]) {
    const api = createDashboardApi({ get: async () => ({ data }) })
    await assert.rejects(api.projects())
  }
})

test('loads the actual selected task using an encoded path', async () => {
  let requested
  const api = createDashboardApi({
    get: async (path) => {
      requested = path
      return { data: { id: 'test-only-id' } }
    },
  })
  await api.task('id/with/slashes')
  assert.equal(requested, '/api/tasks/id%2Fwith%2Fslashes')
})

test('preserves 401 and network errors for the shared authentication/error handling', async () => {
  for (const error of [
    { response: { status: 401 } },
    new Error('Test-only network failure'),
  ]) {
    const api = createDashboardApi({
      get: async () => {
        throw error
      },
    })
    await assert.rejects(api.summary(), (received) => received === error)
  }
})

test('donut contains exactly the backend-supported states, with correct fractions', () => {
  const parts = distribution(summary)
  assert.deepEqual(
    parts.map(({ status }) => status),
    ['DONE', 'IN_PROGRESS', 'TODO'],
  )
  assert.equal(
    parts.reduce((total, { count }) => total + count, 0),
    7,
  )
  assert.ok(
    Math.abs(
      parts.reduce((total, { percentage }) => total + percentage, 0) - 100,
    ) < 1e-10,
  )
  assert.equal(parts[0].percentage, (2 / 7) * 100)
})

test('donut supports a single completed status at 100 percent', () => {
  const parts = distribution({
    totalTasks: 4,
    todoTasks: 0,
    inProgressTasks: 0,
    doneTasks: 4,
  })
  assert.deepEqual(
    parts.map(({ percentage }) => percentage),
    [100, 0, 0],
  )
})

test('formats date-only deadlines without treating them as UTC instants', () => {
  assert.equal(formatDueDate('2026-01-01'), '01/01/2026')
  assert.equal(formatDueDate('2026-12-31'), '31/12/2026')
  assert.equal(formatDueDate(null), 'Chưa đặt hạn')
})

test('greeting follows the local clock at morning/afternoon/evening boundaries', () => {
  assert.equal(greetingAt(new Date(2026, 0, 1, 11, 59)), 'Chào buổi sáng')
  assert.equal(greetingAt(new Date(2026, 0, 1, 12)), 'Chào buổi chiều')
  assert.equal(greetingAt(new Date(2026, 0, 1, 18)), 'Chào buổi tối')
  assert.equal(shortName(' Trần Huỳnh Minh Kiệt '), 'Kiệt')
  assert.equal(shortName(undefined), '')
})

test('publishes a loading state followed by real response data', async () => {
  const changes = []
  await startReadResource(
    async () => summary,
    new AbortController().signal,
    (value) => changes.push(value),
  )
  assert.deepEqual(
    changes.map(({ status }) => status),
    ['loading', 'success'],
  )
  assert.equal(changes[0].data, null)
  assert.equal(changes[1].data, summary)
})

test('publishes API failures without fake fallback data', async () => {
  const changes = []
  await startReadResource(
    async () => {
      throw new Error('Test-only failure')
    },
    new AbortController().signal,
    (value) => changes.push(value),
  )
  assert.deepEqual(
    changes.map(({ status }) => status),
    ['loading', 'error'],
  )
  assert.equal(changes.at(-1).data, null)
})

test('StrictMode cleanup before the microtask prevents an unnecessary request', async () => {
  let requests = 0
  const controller = new AbortController()
  const pending = startReadResource(
    async () => {
      requests++
      return summary
    },
    controller.signal,
    () => {},
  )
  controller.abort()
  await pending
  assert.equal(requests, 0)
})

test('ignores stale completions after navigation/cancellation', async () => {
  let resolve
  const changes = []
  const controller = new AbortController()
  const pending = startReadResource(
    () =>
      new Promise((done) => {
        resolve = done
      }),
    controller.signal,
    (value) => changes.push(value),
  )
  await Promise.resolve()
  controller.abort()
  resolve(summary)
  await pending
  assert.deepEqual(
    changes.map(({ status }) => status),
    ['loading'],
  )
})
