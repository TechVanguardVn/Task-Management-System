import assert from 'node:assert/strict'
import { chromium } from 'playwright'

// Isolated fixture: every external request is intercepted, including authentication.
const origin = 'http://127.0.0.1:4173'
const backend = 'https://task-management-system-i7xu.onrender.com'
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
page.setDefaultTimeout(15000)
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`
const projects = [
  { id: id(1), name: 'Alpha', status: 'ACTIVE' },
  { id: id(2), name: 'Beta', status: 'ACTIVE' },
  { id: id(3), name: 'Archive', status: 'ARCHIVED' },
  { id: id(4), name: 'Empty', status: 'ACTIVE' },
]
let records = Array.from({ length: 105 }, (_, i) => ({
  id: id(100 + i),
  projectId: id(1),
  title: i === 104 ? 'Needle Alpha' : `Alpha task ${i}`,
  status: 'TODO',
  priority: i === 0 ? 'HIGH' : 'MEDIUM',
  dueDate: i === 0 ? '2000-01-01' : '2099-01-01',
  completedAt: null,
  createdAt: '2026-11-23T10:00:00Z',
  updatedAt: '2026-11-23T10:00:00Z',
}))
records.push(
  ...Array.from({ length: 7 }, (_, i) => ({
    ...records[0],
    id: id(300 + i),
    projectId: id(2),
    title: i === 6 ? 'Needle Beta' : `Beta task ${i}`,
    status: i < 2 ? 'DONE' : 'IN_PROGRESS',
    priority: 'LOW',
    dueDate: '2001-01-01',
  })),
  {
    ...records[0],
    id: id(400),
    projectId: id(3),
    title: 'Archived task',
    dueDate: '2002-01-01',
  },
)
const calls = [],
  errors = []
let active = 0,
  maximum = 0,
  failing = false
const envelope = (rows, p, size) => ({
  content: rows.slice(p * size, (p + 1) * size),
  page: p,
  size,
  totalElements: rows.length,
  totalPages: Math.ceil(rows.length / size),
})
await context.route('**/*', async (route) => {
  const request = route.request(),
    url = new URL(request.url()),
    method = request.method(),
    path = url.pathname
  if (url.origin === origin) return route.continue()
  if (url.origin !== backend) {
    errors.push('Unexpected external origin')
    return route.abort()
  }
  const headers = {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type',
  }
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
  const params = Object.fromEntries(url.searchParams),
    body = request.postData() ? request.postDataJSON() : undefined
  calls.push({ path, method, params, body })
  const reply = (json, status = 200) => route.fulfill({ json, status, headers })
  if (path === '/api/auth/me')
    return reply({
      id: id(9),
      name: 'Test User',
      email: 'test@example.invalid',
    })
  if (path === '/api/auth/login')
    return reply({
      accessToken: 'TEST_ONLY_TOKEN',
      expiresAt: new Date(Date.now() + 900000).toISOString(),
      user: { id: id(9), name: 'Test User', email: 'test@example.invalid' },
    })
  if (path === '/api/projects')
    return reply(
      envelope(projects, Number(params.page || 0), Number(params.size || 100)),
    )
  if (path === '/api/dashboard/summary') {
    const rows = records.filter(
      (task) => !params.projectId || task.projectId === params.projectId,
    )
    const count = (status) =>
      rows.filter((task) => task.status === status).length
    return reply({
      totalTasks: rows.length,
      todoTasks: count('TODO'),
      inProgressTasks: count('IN_PROGRESS'),
      doneTasks: count('DONE'),
      completionPercentage: rows.length
        ? (count('DONE') / rows.length) * 100
        : 0,
    })
  }
  if (path.startsWith('/api/dashboard/'))
    return reply(
      envelope(
        path.endsWith('overdue')
          ? records.filter(
              (task) =>
                (!params.projectId || task.projectId === params.projectId) &&
                task.status !== 'DONE' &&
                task.dueDate < '2026-11-23',
            )
          : [],
        Number(params.page || 0),
        Number(params.size || 4),
      ),
    )
  const list = path.match(/^\/api\/projects\/([^/]+)\/tasks$/)
  if (list && method === 'GET') {
    active++
    maximum = Math.max(maximum, active)
    try {
      await new Promise((resolve) => setTimeout(resolve, 70))
      if (failing && list[1] === id(2)) return await reply({}, 503)
      let rows = records.filter(
        (task) =>
          task.projectId === list[1] &&
          (!params.search ||
            task.title.toLowerCase().includes(params.search.toLowerCase())) &&
          (!params.status || task.status === params.status) &&
          (!params.priority || task.priority === params.priority),
      )
      rows = [...rows].sort((a, b) => a.id.localeCompare(b.id))
      return await reply(
        envelope(rows, Number(params.page || 0), Number(params.size || 100)),
      )
    } finally {
      active--
    }
  }
  if (list && method === 'POST') {
    const task = {
      ...body,
      id: id(900),
      createdAt: '2026-11-23T11:00:00Z',
      updatedAt: '2026-11-23T11:00:00Z',
      completedAt: null,
    }
    records.push(task)
    return reply(task, 201)
  }
  const item = path.match(/^\/api\/tasks\/([^/]+)(\/status)?$/)
  if (item) {
    const index = records.findIndex((task) => task.id === item[1])
    if (index < 0) return reply({}, 404)
    if (method === 'GET') return reply(records[index])
    if (method === 'DELETE') {
      records.splice(index, 1)
      return route.fulfill({ status: 204, headers })
    }
    records[index] = {
      ...records[index],
      ...body,
      completedAt: body.status === 'DONE' ? '2026-11-23T12:00:00Z' : null,
    }
    return reply(records[index])
  }
  errors.push(`${method} ${path}`)
  return route.abort()
})
page.on('pageerror', (error) => errors.push(error.message))
const taskReads = () =>
  calls.filter(
    (call) =>
      call.method === 'GET' && /\/projects\/[^/]+\/tasks$/.test(call.path),
  )
const scope = () => page.getByLabel('Dự án đang xem', { exact: true })
const rows = () => page.locator('.task-table tbody tr')
const dialog = () => page.locator('.project-dialog')
const nav = (name) =>
  page
    .locator('.workspace-sidebar')
    .getByRole('link', { name, exact: true })
    .click()
async function login() {
  await page.goto(origin + '/login')
  await page.getByLabel('Email', { exact: true }).fill('test@example.invalid')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.waitForURL(origin + '/dashboard')
  await nav('Việc của tôi')
}
async function total(value) {
  await page.waitForFunction(
    (count) =>
      document
        .querySelector('.task-pagination')
        ?.textContent.includes(`${count} công việc phù hợp`),
    value,
  )
}
/* global document */
try {
  await login()
  await total(113)
  assert.equal(await scope().inputValue(), 'all')
  assert.equal(
    await scope().locator('option').first().textContent(),
    'Tất cả dự án',
  )
  assert.equal(maximum, 3)
  assert.ok(taskReads().some((call) => call.params.page === '1'))
  for (const name of ['Alpha', 'Beta', 'Archive'])
    assert.ok(await rows().getByText(name, { exact: true }).count())
  assert.equal(
    await rows()
      .filter({ hasText: 'Archived task' })
      .getByRole('button', { name: 'Sửa', exact: true })
      .isDisabled(),
    true,
  )
  assert.equal(
    await page.locator('.task-stat-todo strong').textContent(),
    '106',
  )
  assert.equal(await page.locator('.task-stat-late strong').textContent(), '7')
  const reads = taskReads().length
  await scope().selectOption(id(2))
  await total(7)
  assert.equal(await rows().count(), 7)
  await scope().selectOption('all')
  await total(113)
  assert.equal(taskReads().length, reads)
  await page
    .getByLabel('Tìm theo tên công việc', { exact: true })
    .fill('needle')
  await total(2)
  assert.equal(await rows().count(), 2)
  await page.getByLabel('Trạng thái', { exact: true }).selectOption('TODO')
  await total(1)
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click()
  await total(113)
  await page.getByLabel('Ưu tiên', { exact: true }).selectOption('HIGH')
  await total(2)
  await page.getByRole('button', { name: 'Xóa bộ lọc', exact: true }).click()
  await total(113)
  await page.getByRole('button', { name: 'Sau', exact: true }).click()
  assert.equal(await rows().count(), 10)
  assert.ok(
    await page
      .locator('.task-pagination')
      .textContent()
      .then((text) => text.includes('Trang 2 / 12')),
  )
  console.log(
    'PASS default scope, all pages, concurrency, names, global filters/totals/pagination, cached scope switching, archive locks and server overdue counts',
  )

  await page
    .getByRole('button', { name: '+ Thêm công việc', exact: true })
    .click()
  assert.equal(
    await dialog().getByLabel('Dự án', { exact: true }).inputValue(),
    '',
  )
  await dialog()
    .getByLabel('Tên công việc', { exact: true })
    .fill('Needle created')
  await dialog()
    .getByRole('button', { name: 'Thêm công việc', exact: true })
    .click()
  assert.equal(
    calls.filter(
      (call) => call.method === 'POST' && call.path.includes('/projects/'),
    ).length,
    0,
  )
  await dialog().getByLabel('Dự án', { exact: true }).selectOption(id(2))
  await dialog()
    .getByRole('button', { name: 'Thêm công việc', exact: true })
    .click()
  await dialog().waitFor({ state: 'hidden' })
  await total(114)
  assert.equal(await scope().inputValue(), 'all')
  await page
    .getByLabel('Tìm theo tên công việc', { exact: true })
    .fill('Needle created')
  await total(1)
  await rows().getByRole('combobox').selectOption('DONE')
  await page.waitForFunction(
    () => document.querySelector('.task-table select')?.value === 'DONE',
  )
  await rows().getByRole('button', { name: 'Sửa', exact: true }).click()
  assert.equal(
    await dialog().getByLabel('Dự án', { exact: true }).inputValue(),
    id(2),
  )
  await dialog().getByLabel('Dự án', { exact: true }).selectOption(id(1))
  await dialog()
    .getByRole('button', { name: 'Lưu thay đổi', exact: true })
    .click()
  await dialog().waitFor({ state: 'hidden' })
  assert.equal(await rows().getByText('Alpha', { exact: true }).count(), 1)
  await rows()
    .getByRole('link', { name: 'Needle created', exact: true })
    .click()
  await page
    .getByRole('heading', { name: 'Needle created', exact: true })
    .waitFor()
  await nav('Việc của tôi')
  await total(114)
  await page
    .getByLabel('Tìm theo tên công việc', { exact: true })
    .fill('Needle created')
  await total(1)
  await rows().getByRole('button', { name: 'Xóa', exact: true }).click()
  await dialog()
    .getByRole('button', { name: 'Xóa vĩnh viễn', exact: true })
    .click()
  await dialog().waitFor({ state: 'hidden' })
  await total(0)
  assert.ok(
    calls
      .filter((call) => call.body?.projectId)
      .every((call) => call.body.projectId !== 'all'),
  )
  console.log(
    'PASS all-scope creation requires a real project; view, status, edit/move, delete and cache updates',
  )

  await scope().selectOption(id(2))
  await total(7)
  await page
    .getByRole('button', { name: '+ Thêm công việc', exact: true })
    .click()
  assert.equal(
    await dialog().getByLabel('Dự án', { exact: true }).inputValue(),
    id(2),
  )
  await dialog()
    .getByLabel('Tên công việc', { exact: true })
    .fill('Single created')
  await dialog()
    .getByRole('button', { name: 'Thêm công việc', exact: true })
    .click()
  await dialog().waitFor({ state: 'hidden' })
  await total(8)
  await page
    .getByLabel('Tìm theo tên công việc', { exact: true })
    .fill('Single created')
  await total(1)
  await rows().getByRole('button', { name: 'Sửa', exact: true }).click()
  assert.equal(
    await dialog().getByLabel('Dự án', { exact: true }).inputValue(),
    id(2),
  )
  await dialog()
    .getByLabel('Tên công việc', { exact: true })
    .fill('Single edited')
  await dialog()
    .getByRole('button', { name: 'Lưu thay đổi', exact: true })
    .click()
  await dialog().waitFor({ state: 'hidden' })
  await total(0)
  await page
    .getByLabel('Tìm theo tên công việc', { exact: true })
    .fill('Single edited')
  await total(1)
  await rows().getByRole('combobox').selectOption('IN_PROGRESS')
  await rows().getByRole('button', { name: 'Xóa', exact: true }).click()
  await dialog()
    .getByRole('button', { name: 'Xóa vĩnh viễn', exact: true })
    .click()
  await dialog().waitFor({ state: 'hidden' })
  await total(0)
  await scope().selectOption('all')
  await total(113)
  console.log(
    'PASS individual-scope create, edit, status and delete retain actual project association',
  )

  failing = true
  await login()
  await page
    .getByRole('button', { name: 'Thử lại các dự án tải lỗi', exact: true })
    .waitFor()
  assert.equal(await page.locator('.task-table').count(), 0)
  assert.equal(await page.locator('.task-pagination').count(), 0)
  assert.ok(
    await page.locator('.project-error').filter({ hasText: 'Beta' }).count(),
  )
  const alphaReads = taskReads().filter((call) =>
    call.path.includes(id(1)),
  ).length
  failing = false
  await page
    .getByRole('button', { name: 'Thử lại các dự án tải lỗi', exact: true })
    .click()
  await total(113)
  assert.equal(
    taskReads().filter((call) => call.path.includes(id(1))).length,
    alphaReads,
  )
  assert.ok(calls.every((call) => call.path !== '/api/tasks'))
  assert.deepEqual(errors, [])
  console.log(
    'PASS explicit partial failure, no incomplete list/totals, retry only failed project; no global GET /api/tasks and no production traffic',
  )
} finally {
  await browser.close()
}
