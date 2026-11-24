import assert from 'node:assert/strict'
import test from 'node:test'
import { createProjectsApi } from '../src/api/projectRequests.js'
import {
  projectForm,
  projectPayload,
  validateProject,
  visibleProjects,
  projectError,
  projectFieldErrors,
} from '../src/components/projects/projectModel.js'

const project = {
  id: 'test-only-id',
  ownerId: 'server-owner',
  name: 'Dự án A',
  description: 'Mô tả hiện có',
  color: 'rebeccapurple',
  status: 'ARCHIVED',
  startDate: '2026-01-01',
  dueDate: '2026-02-01',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}

test('project forms retain all supported optional values and archived status in complete PUT payloads', () => {
  const body = projectPayload(
    { ...projectForm(project), name: 'Tên mới' },
    project,
  )
  assert.deepEqual(body, {
    name: 'Tên mới',
    description: project.description,
    color: project.color,
    status: 'ARCHIVED',
    startDate: project.startDate,
    dueDate: project.dueDate,
  })
  assert.equal(Object.hasOwn(body, 'ownerId'), false)
  assert.equal(Object.hasOwn(body, 'id'), false)
})

test('create defaults to ACTIVE and empty optional fields are explicit nulls', () => {
  assert.deepEqual(
    projectPayload({ ...projectForm(), name: '  Dự án mới  ' }),
    {
      name: 'Dự án mới',
      description: null,
      color: null,
      status: 'ACTIVE',
      startDate: null,
      dueDate: null,
    },
  )
})

test('editing can intentionally clear an optional value without clearing the other fields', () => {
  const body = projectPayload(
    { ...projectForm(project), description: '' },
    project,
  )
  assert.equal(body.description, null)
  assert.equal(body.color, project.color)
  assert.equal(body.startDate, project.startDate)
  assert.equal(body.dueDate, project.dueDate)
})

test('validates required name and every backend field length', () => {
  const values = projectForm(project)
  assert.deepEqual(validateProject(values), {})
  assert.ok(validateProject({ ...values, name: ' ' }).name)
  assert.ok(validateProject({ ...values, name: 'a'.repeat(121) }).name)
  assert.ok(
    validateProject({ ...values, description: 'a'.repeat(10001) }).description,
  )
  assert.ok(validateProject({ ...values, color: 'a'.repeat(33) }).color)
})

test('validates date ranges, allows equal dates and optional boundaries', () => {
  const values = projectForm(project)
  assert.ok(validateProject({ ...values, dueDate: '2025-12-31' }).dueDate)
  assert.equal(
    validateProject({ ...values, dueDate: values.startDate }).dueDate,
    undefined,
  )
  assert.equal(
    validateProject({ ...values, startDate: '', dueDate: '2025-12-31' })
      .dueDate,
    undefined,
  )
})

test('search is case-insensitive and filters only the provided loaded page', () => {
  const projects = [
    project,
    { ...project, id: 'test-active', name: 'VIỆC MỚI', status: 'ACTIVE' },
  ]
  assert.equal(
    visibleProjects(projects, 'việc', 'ALL', 'createdAt:desc')[0].id,
    'test-active',
  )
  assert.equal(
    visibleProjects(projects, '', 'ARCHIVED', 'createdAt:desc').length,
    1,
  )
  assert.equal(
    visibleProjects(projects, 'absent', 'ALL', 'createdAt:desc').length,
    0,
  )
  assert.equal(projects.length, 2)
})

test('date sorting is stable, nonmutating and keeps missing dates last', () => {
  const projects = [
    { ...project, id: 'b', dueDate: null },
    { ...project, id: 'c', dueDate: '2026-02-01' },
    { ...project, id: 'a', dueDate: '2026-01-01' },
  ]
  assert.deepEqual(
    visibleProjects(projects, '', 'ALL', 'dueDate:asc').map(({ id }) => id),
    ['a', 'c', 'b'],
  )
  assert.deepEqual(
    projects.map(({ id }) => id),
    ['b', 'c', 'a'],
  )
})

test('maps errors without revealing other-user ownership or raw diagnostics', () => {
  assert.match(projectError({ response: { status: 404 } }), /không có quyền/)
  assert.match(projectError({ response: { status: 403 } }), /không có quyền/)
  assert.match(
    projectError({ response: { status: 409 } }),
    /Dữ liệu đã thay đổi/,
  )
  assert.match(projectError({}), /kết nối/)
  const fields = projectFieldErrors({
    response: {
      data: {
        validationErrors: [
          { field: 'dateRangeValid', message: 'Internal diagnostic' },
          { field: 'ownerId' },
        ],
      },
    },
  })
  assert.deepEqual(Object.keys(fields), ['dueDate'])
  assert.deepEqual(
    projectFieldErrors({ response: { data: { validationErrors: {} } } }),
    {},
  )
})

test('uses only documented project routes and pagination query parameters', async () => {
  const calls = []
  const signal = new AbortController().signal
  const client = Object.fromEntries(
    ['get', 'post', 'put', 'patch', 'delete'].map((method) => [
      method,
      async (...args) => {
        calls.push({ method, args })
        return { data: { content: [], totalPages: 0 } }
      },
    ]),
  )
  const api = createProjectsApi(client)
  const body = projectPayload(projectForm(project), project)
  await api.list(2, signal)
  await api.get('id/encoded', signal)
  await api.create(body, signal)
  await api.update('id/encoded', body, signal)
  await api.archive('id/encoded', signal)
  await api.remove('id/encoded', signal)
  await api.tasks('id/encoded', 1, signal)
  assert.deepEqual(
    calls.map(({ method, args }) => [method, args[0]]),
    [
      ['get', '/api/projects'],
      ['get', '/api/projects/id%2Fencoded'],
      ['post', '/api/projects'],
      ['put', '/api/projects/id%2Fencoded'],
      ['patch', '/api/projects/id%2Fencoded/archive'],
      ['delete', '/api/projects/id%2Fencoded'],
      ['get', '/api/projects/id%2Fencoded/tasks'],
    ],
  )
  assert.deepEqual(calls[0].args[1], { params: { page: 2, size: 9 }, signal })
  assert.deepEqual(calls[6].args[1], { params: { page: 1, size: 10 }, signal })
  assert.deepEqual(calls[3].args[1], body)
})

test('API failures propagate to the shared bearer/error handling', async () => {
  const failure = { response: { status: 401 } }
  const api = createProjectsApi({
    get: async () => {
      throw failure
    },
  })
  await assert.rejects(api.list(0), (error) => error === failure)
})
