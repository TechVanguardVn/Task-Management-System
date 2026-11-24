import assert from 'node:assert/strict'
import test from 'node:test'
import { createTasksApi } from '../src/api/taskRequests.js'
import {
  canMove,
  columnQuery,
  columnTasks,
  mergeTasks,
  orderedTasks,
  timestamp,
} from '../src/components/kanban/kanbanModel.js'

const task = {
  id: 'a',
  projectId: 'owned-project',
  title: 'Công việc',
  status: 'TODO',
  priority: 'HIGH',
  createdAt: '2026-11-01T00:00:00Z',
  completedAt: null,
}
test('each column uses documented server filters, bounded size and stable sort, including later pages', () => {
  assert.deepEqual(columnQuery('DONE', 'TiÊu đề_%', 'HIGH', 3), {
    status: 'DONE',
    search: 'TiÊu đề_%',
    priority: 'HIGH',
    page: 3,
    size: 20,
    sort: 'createdAt,desc',
  })
  assert.equal(columnQuery('TODO', '', '').page, 0)
})
test('incremental metadata merges repeated UUIDs without duplicate cards and uses latest representation', () => {
  const newer = { ...task, title: 'Mới nhất' }
  assert.deepEqual(mergeTasks([task], [newer, { ...task, id: 'b' }]), [
    newer,
    { ...task, id: 'b' },
  ])
})
test('card ordering is nonmutating, newest-first with deterministic UUID tie-breaker', () => {
  const rows = [
    { ...task, id: 'b' },
    task,
    { ...task, id: 'c', createdAt: '2026-11-02T00:00:00Z' },
  ]
  assert.deepEqual(
    orderedTasks(rows).map((row) => row.id),
    ['c', 'a', 'b'],
  )
  assert.deepEqual(
    rows.map((row) => row.id),
    ['b', 'a', 'c'],
  )
})
test('optimistic cross-column movement does not fabricate timestamps; removing projection rolls back', () => {
  const pending = { task, status: 'DONE' }
  assert.deepEqual(columnTasks([task], 'TODO', pending), [])
  assert.deepEqual(columnTasks([], 'DONE', pending), [
    { ...task, status: 'DONE' },
  ])
  assert.equal(columnTasks([], 'DONE', pending)[0].completedAt, null)
  assert.deepEqual(columnTasks([task], 'TODO', null), [task])
  assert.deepEqual(columnTasks([], 'DONE', null), [])
  assert.equal(task.status, 'TODO')
})
test('same-column drops, invalid status, missing tasks, archived projects and pending writes are no-ops', () => {
  assert.equal(canMove(task, 'IN_PROGRESS', false, false), true)
  for (const [source, status, locked, pending] of [
    [task, 'TODO', false, false],
    [task, 'BLOCKED', false, false],
    [null, 'DONE', false, false],
    [task, 'DONE', true, false],
    [task, 'DONE', false, true],
  ])
    assert.equal(canMove(source, status, locked, pending), false)
})
test('drawer reads the actual task endpoint with cancellation, preserving 404/401 failures', async () => {
  const signal = new AbortController().signal
  let args
  const api = createTasksApi({
    get: async (...received) => {
      args = received
      return { data: task }
    },
  })
  assert.deepEqual(await api.get('task/id', signal), task)
  assert.deepEqual(args, ['/api/tasks/task%2Fid', { signal }])
  for (const status of [404, 401]) {
    const failure = { response: { status } }
    await assert.rejects(
      createTasksApi({
        get: async () => {
          throw failure
        },
      }).get('foreign'),
      (error) => error === failure,
    )
  }
})
test('optional and invalid timestamps display an empty value rather than invented dates', () => {
  assert.equal(timestamp(null), 'Chưa có')
  assert.equal(timestamp('bad-date'), 'Chưa có')
  assert.ok(timestamp('2026-11-01T00:00:00Z').includes('2026'))
})
