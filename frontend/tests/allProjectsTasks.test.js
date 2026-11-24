import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  createRequestLimiter,
  loadTaskCollection,
} from '../src/api/taskCollection.js'
import { combinedTaskPage } from '../src/components/tasks/combinedTasks.js'
import {
  defaultTaskQuery,
  taskForm,
  validateTask,
} from '../src/components/tasks/taskModel.js'

const task = (id, projectId = 'p1', fields = {}) => ({
  id,
  projectId,
  title: `Task ${id}`,
  priority: 'MEDIUM',
  status: 'TODO',
  dueDate: '2099-01-01',
  createdAt: '2026-11-23T10:00:00Z',
  ...fields,
})
test('complete project snapshot retrieves every page including empty projects with real scope IDs', async () => {
  const calls = [],
    rows = Array.from({ length: 205 }, (_, i) => task(String(i)))
  const api = {
    list: async (id, query) => {
      calls.push({ id, ...query })
      return {
        content: rows.slice(query.page * 100, (query.page + 1) * 100),
        totalElements: 205,
        totalPages: 3,
      }
    },
  }
  const snapshot = await loadTaskCollection(api, 'p1')
  assert.equal(snapshot.content.length, 205)
  assert.deepEqual(
    calls.map((call) => call.page),
    [0, 1, 2],
  )
  assert.ok(
    calls.every(
      (call) =>
        call.id === 'p1' && call.size === 100 && !call.status && !call.search,
    ),
  )
  assert.deepEqual(
    await loadTaskCollection(
      { list: async () => ({ content: [], totalPages: 0, totalElements: 0 }) },
      'empty',
    ),
    { content: [], totalElements: 0 },
  )
})

test('page failure rejects the entire snapshot instead of returning a partial first page', async () => {
  await assert.rejects(
    loadTaskCollection(
      {
        list: async (_id, query) => {
          if (query.page === 1) throw new Error('network failure')
          return {
            content: Array.from({ length: 100 }, (_, i) => task(String(i))),
            totalElements: 101,
            totalPages: 2,
          }
        },
      },
      'p1',
    ),
    /network failure/,
  )
})

test('changed totals, duplicate rows and foreign project rows are rejected explicitly', async () => {
  await assert.rejects(
    loadTaskCollection(
      {
        list: async (_id, query) =>
          query.page === 0
            ? {
                content: Array.from({ length: 100 }, (_, i) => task(String(i))),
                totalElements: 101,
                totalPages: 2,
              }
            : { content: [task('last')], totalElements: 102, totalPages: 2 },
      },
      'p1',
    ),
  )
  await assert.rejects(
    loadTaskCollection(
      {
        list: async () => ({
          content: [task('a'), task('a')],
          totalElements: 2,
          totalPages: 1,
        }),
      },
      'p1',
    ),
  )
  await assert.rejects(
    loadTaskCollection(
      {
        list: async () => ({
          content: [task('a', 'foreign')],
          totalElements: 1,
          totalPages: 1,
        }),
      },
      'p1',
    ),
  )
})

test('limiter runs at most three reads concurrently and cancels queued requests', async () => {
  const limit = createRequestLimiter(3)
  let active = 0,
    maximum = 0,
    canceledRan = false
  const jobs = Array.from({ length: 8 }, () =>
    limit(async () => {
      active++
      maximum = Math.max(maximum, active)
      await new Promise((resolve) => setTimeout(resolve, 5))
      active--
    }),
  )
  const controller = new AbortController()
  const canceled = limit(() => {
    canceledRan = true
  }, controller.signal)
  const rejection = assert.rejects(canceled, { code: 'ERR_CANCELED' })
  controller.abort()
  await Promise.all([...jobs, rejection])
  assert.equal(maximum, 3)
  assert.equal(canceledRan, false)
})

test('search/status/priority and pagination operate on the combined dataset, not per-project pages', () => {
  const rows = [
    ...Array.from({ length: 105 }, (_, i) => task(String(i))),
    task('needle', 'p2', {
      title: 'NEEDLE Beta',
      status: 'DONE',
      priority: 'HIGH',
    }),
  ]
  const filtered = combinedTaskPage(rows, {
    ...defaultTaskQuery,
    search: 'needle',
    status: 'DONE',
    priority: 'HIGH',
  })
  assert.equal(filtered.totalElements, 1)
  assert.equal(filtered.content[0].projectId, 'p2')
  const last = combinedTaskPage(rows, { ...defaultTaskQuery, page: 10 })
  assert.equal(last.totalElements, 106)
  assert.equal(last.totalPages, 11)
  assert.equal(last.content.length, 6)
  assert.equal(combinedTaskPage([], defaultTaskQuery).totalPages, 0)
})

test('global sorting handles enum priorities, null dates and stable UUID ties without mutating input', () => {
  const rows = [
    task('b', 'p1', { priority: 'LOW', dueDate: null }),
    task('a', 'p2', { priority: 'HIGH' }),
    task('c', 'p2', { priority: 'MEDIUM' }),
  ]
  assert.deepEqual(
    combinedTaskPage(rows, {
      ...defaultTaskQuery,
      sort: 'priority,desc',
    }).content.map((row) => row.id),
    ['a', 'c', 'b'],
  )
  assert.deepEqual(
    combinedTaskPage(rows, defaultTaskQuery).content.map((row) => row.id),
    ['a', 'c', 'b'],
  )
  assert.deepEqual(
    combinedTaskPage(rows, {
      ...defaultTaskQuery,
      sort: 'dueDate,desc',
    }).content.map((row) => row.id),
    ['b', 'a', 'c'],
  )
  assert.deepEqual(
    rows.map((row) => row.id),
    ['b', 'a', 'c'],
  )
  const timestamps = [
    task('a', 'p1', { createdAt: '2026-11-23T10:00:00Z' }),
    task('b', 'p2', { createdAt: '2026-11-23T10:00:00.000Z' }),
    task('c', 'p2', { createdAt: '2026-11-23T10:00:00.000001Z' }),
  ]
  assert.deepEqual(
    combinedTaskPage(timestamps, {
      ...defaultTaskQuery,
      sort: 'createdAt,desc',
    }).content.map((row) => row.id),
    ['c', 'a', 'b'],
  )
})

test('All Projects creation requires an active actual project and preserves edited association', () => {
  const projects = [
    { id: 'p1', status: 'ACTIVE' },
    { id: 'p2', status: 'ARCHIVED' },
  ]
  const values = { ...taskForm(null, ''), title: 'Created task' }
  assert.ok(validateTask(values, projects).projectId)
  assert.ok(validateTask({ ...values, projectId: 'all' }, projects).projectId)
  assert.ok(validateTask({ ...values, projectId: 'p2' }, projects).projectId)
  assert.equal(
    validateTask({ ...values, projectId: 'p1' }, projects).projectId,
    undefined,
  )
  assert.equal(taskForm(task('a', 'p1'), '').projectId, 'p1')
})
