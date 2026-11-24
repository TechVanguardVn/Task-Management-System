import assert from 'node:assert/strict'
import test from 'node:test'
import { createTasksApi } from '../src/api/taskRequests.js'
import {
  defaultTaskQuery,
  taskForm,
  taskPayload,
  validateTask,
  dueIndicator,
  taskError,
  taskFieldErrors,
} from '../src/components/tasks/taskModel.js'

const projects = [
  { id: 'owned-a', status: 'ACTIVE' },
  { id: 'owned-b', status: 'ACTIVE' },
  { id: 'archived', status: 'ARCHIVED' },
]
const task = {
  id: 'task-id',
  projectId: 'owned-a',
  title: 'Tên gốc',
  description: 'Giữ nguyên mô tả',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  dueDate: '2026-03-22',
  completedAt: null,
  ownerId: 'never-submit',
}

test('complete PUT preserves unedited fields and excludes database-managed values', () => {
  assert.deepEqual(taskPayload({ ...taskForm(task), title: '  Tên mới  ' }), {
    projectId: 'owned-a',
    title: 'Tên mới',
    description: task.description,
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: task.dueDate,
  })
  assert.deepEqual(
    taskPayload({ ...taskForm(null, 'owned-a'), title: 'Mới' }),
    {
      projectId: 'owned-a',
      title: 'Mới',
      description: null,
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: null,
    },
  )
})
test('clearing nullable fields does not reset status, priority or project', () => {
  assert.deepEqual(
    taskPayload({ ...taskForm(task), description: '', dueDate: '' }),
    {
      projectId: 'owned-a',
      title: task.title,
      description: null,
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: null,
    },
  )
})
test('validation rejects blank/long title, long description, invalid enum/date and foreign project', () => {
  const values = taskForm(task)
  assert.deepEqual(validateTask(values, projects, task.projectId), {})
  for (const [field, value] of [
    ['title', ' '],
    ['title', 'x'.repeat(256)],
    ['description', 'x'.repeat(10001)],
    ['status', 'BLOCKED'],
    ['priority', 'URGENT'],
    ['dueDate', '2026-02-30'],
    ['dueDate', 'not-a-date'],
    ['projectId', 'foreign'],
  ])
    assert.ok(
      validateTask({ ...values, [field]: value }, projects)[field],
      field,
    )
  assert.deepEqual(
    validateTask({ ...values, dueDate: '2028-02-29' }, projects),
    {},
  )
})
test('moves allowed only between two active owned projects; archived source/target blocked', () => {
  assert.deepEqual(
    validateTask(
      { ...taskForm(task), projectId: 'owned-b' },
      projects,
      'owned-a',
    ),
    {},
  )
  assert.ok(
    validateTask(
      { ...taskForm(task), projectId: 'archived' },
      projects,
      'owned-a',
    ).projectId,
  )
  assert.ok(
    validateTask(
      { ...taskForm(task), projectId: 'owned-a' },
      projects,
      'archived',
    ).projectId,
  )
})
test('due labels use local calendar days: yesterday/today/+7/+8; DONE and undated never overdue', () => {
  const now = new Date(2026, 2, 22, 23, 59)
  const label = (dueDate, status = 'TODO') =>
    dueIndicator({ dueDate, status }, now)?.kind
  assert.equal(label('2026-03-21'), 'overdue')
  assert.equal(label('2026-03-22'), 'upcoming')
  assert.equal(label('2026-03-29'), 'upcoming')
  assert.equal(label('2026-03-30'), undefined)
  assert.equal(label('2026-03-21', 'DONE'), undefined)
  assert.equal(label(null), undefined)
})
test('error messages are localized, do not leak diagnostics and expose known validation fields only', () => {
  for (const status of [403, 404, 409, 400, 500])
    assert.ok(taskError({ response: { status } }).length)
  assert.match(taskError({}), /kết nối/)
  const errors = taskFieldErrors({
    response: {
      data: {
        validationErrors: [
          { field: 'title', message: 'secret diagnostic' },
          { field: 'ownerId' },
          null,
        ],
      },
    },
  })
  assert.deepEqual(Object.keys(errors), ['title'])
  assert.equal(JSON.stringify(errors).includes('secret'), false)
  assert.deepEqual(
    taskFieldErrors({ response: { data: { validationErrors: {} } } }),
    {},
  )
})
test('task listing combines server filters with documented sort/page/size and abort signal', async () => {
  let received
  const api = createTasksApi({
    get: async (...args) => {
      received = args
      return { data: { content: [], totalPages: 0 } }
    },
  })
  const signal = new AbortController().signal
  await api.list(
    'id/encoded',
    {
      ...defaultTaskQuery,
      search: 'ViỆc_%',
      priority: 'HIGH',
      status: 'TODO',
      sort: 'title,asc',
      page: 2,
      size: 20,
    },
    signal,
  )
  assert.deepEqual(received, [
    '/api/projects/id%2Fencoded/tasks',
    {
      params: {
        page: 2,
        size: 20,
        sort: 'title,asc',
        search: 'ViỆc_%',
        status: 'TODO',
        priority: 'HIGH',
      },
      signal,
    },
  ])
  await api.list('owned-a', defaultTaskQuery, signal)
  assert.deepEqual(received[1].params, {
    page: 0,
    size: 10,
    sort: 'dueDate,asc',
  })
})
test('project selector reads every metadata page sequentially and deduplicates; never fetches all projects tasks', async () => {
  const calls = []
  const api = createTasksApi({
    get: async (path, { params }) => {
      calls.push([path, params])
      return {
        data: {
          content:
            params.page === 0
              ? [projects[0], projects[1]]
              : [projects[1], projects[2]],
          totalPages: 2,
        },
      }
    },
  })
  assert.deepEqual(await api.projects(), projects)
  assert.deepEqual(calls, [
    ['/api/projects', { page: 0, size: 100 }],
    ['/api/projects', { page: 1, size: 100 }],
  ])
})
test('project metadata stops pagination when aborted; malformed pages do not become empty successes', async () => {
  const controller = new AbortController()
  let count = 0
  const api = createTasksApi({
    get: async () => {
      count++
      controller.abort()
      return { data: { content: [], totalPages: 3 } }
    },
  })
  await assert.rejects(api.projects(controller.signal), { name: 'AbortError' })
  assert.equal(count, 1)
  await assert.rejects(
    createTasksApi({ get: async () => ({ data: {} }) }).list(
      'owned-a',
      defaultTaskQuery,
    ),
  )
})
test('summary/overdue scope uses server aggregates, size one for accurate overdue total', async () => {
  const calls = []
  const signal = new AbortController().signal
  const api = createTasksApi({
    get: async (...args) => {
      calls.push(args)
      return { data: { content: [], totalPages: 0, totalElements: 25 } }
    },
  })
  await api.summary('owned-a', signal)
  assert.equal((await api.overdue('owned-a', signal)).totalElements, 25)
  assert.deepEqual(calls, [
    ['/api/dashboard/summary', { params: { projectId: 'owned-a' }, signal }],
    [
      '/api/dashboard/overdue',
      { params: { projectId: 'owned-a', page: 0, size: 1 }, signal },
    ],
  ])
})
test('CRUD/status use only documented endpoints, complete bodies and signals; failures propagate', async () => {
  const calls = []
  const client = Object.fromEntries(
    ['post', 'put', 'patch', 'delete'].map((method) => [
      method,
      async (...args) => {
        calls.push([method, ...args])
        return { data: task }
      },
    ]),
  )
  const api = createTasksApi(client)
  const body = taskPayload(taskForm(task))
  const signal = new AbortController().signal
  await api.create(body, signal)
  await api.update('task/id', body, signal)
  await api.status('task/id', 'DONE', signal)
  await api.remove('task/id', signal)
  assert.deepEqual(calls, [
    ['post', '/api/projects/owned-a/tasks', body, { signal }],
    ['put', '/api/tasks/task%2Fid', body, { signal }],
    ['patch', '/api/tasks/task%2Fid/status', { status: 'DONE' }, { signal }],
    ['delete', '/api/tasks/task%2Fid', { signal }],
  ])
  const failure = { response: { status: 401 } }
  await assert.rejects(
    createTasksApi({
      get: async () => {
        throw failure
      },
    }).list('owned-a', defaultTaskQuery),
    (error) => error === failure,
  )
})
