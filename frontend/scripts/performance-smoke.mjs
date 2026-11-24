import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const origin = 'http://127.0.0.1:4173',
  backend = 'https://task-management-system-i7xu.onrender.com'
// All nonlocal traffic is intercepted below. This script never contacts the live API.
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
page.setDefaultTimeout(12000)
const calls = [],
  errors = [],
  unexpected = []
const id = (n) => `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`
let projects = [
  { id: id(1), name: 'Ứng dụng TaskFlow', status: 'ACTIVE' },
  { id: id(2), name: 'Dự án tiếp theo', status: 'ACTIVE' },
  { id: id(3), name: 'Dự án đã lưu trữ', status: 'ARCHIVED' },
]
let records = Array.from({ length: 25 }, (_, i) => ({
  id: id(100 + i),
  projectId: id(1),
  title: `Công việc cần làm ${String(i + 1).padStart(2, '0')}`,
  description: 'Mô tả rút gọn từ danh sách.',
  status: 'TODO',
  priority: i % 2 === 0 ? 'HIGH' : 'MEDIUM',
  dueDate: i === 0 ? '2000-01-01' : '2099-01-01',
  completedAt: null,
  createdAt: new Date(Date.UTC(2026, 10, 22, 12, 0, -i)).toISOString(),
  updatedAt: '2026-11-22T12:00:00Z',
}))
records.push(
  ...[
    {
      ...records[0],
      id: id(200),
      title: 'Đang phát triển giao diện',
      status: 'IN_PROGRESS',
    },
    {
      ...records[1],
      id: id(201),
      title: 'Kiểm tra tài liệu',
      status: 'IN_PROGRESS',
    },
    {
      ...records[0],
      id: id(300),
      title: 'Đã hoàn thành kiểm thử',
      status: 'DONE',
      completedAt: '2026-11-22T12:00:00Z',
    },
    {
      ...records[0],
      id: id(400),
      projectId: id(3),
      title: 'Công việc chỉ đọc',
    },
  ],
)
records = records.filter((t) =>
  [id(100), id(101), id(102), id(200), id(201), id(300)].includes(t.id),
)
let mode = 'normal',
  readDelay = 0,
  nextId = 900
const envelope = (content, p, size, total) => ({
  content,
  page: p,
  size,
  totalElements: total,
  totalPages: Math.ceil(total / size),
})
await context.route('**/*', async (route) => {
  const request = route.request()
  if (request.url().startsWith(origin)) return route.continue()
  if (!request.url().startsWith(backend)) {
    unexpected.push(request.url())
    return route.abort()
  }
  const url = new URL(request.url()),
    path = url.pathname,
    method = request.method(),
    params = Object.fromEntries(url.searchParams)
  const headers = {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'access-control-allow-headers': 'content-type,authorization',
  }
  if (method === 'OPTIONS') return route.fulfill({ status: 204, headers })
  const body = request.postData() ? request.postDataJSON() : undefined
  calls.push({
    path,
    method,
    params,
    body,
    authorization: request.headers().authorization,
  })
  if (method === 'GET' && readDelay && !path.includes('/tasks'))
    await new Promise((done) => setTimeout(done, readDelay))
  const reply = (json, status = 200) => route.fulfill({ status, headers, json })
  if (path === '/api/auth/me')
    return reply({
      id: 'test-user',
      name: 'Người kiểm thử',
      email: 'test@example.invalid',
    })
  if (path === '/api/auth/login')
    return reply({
      accessToken: 'TEST_ONLY_ACCESS_TOKEN',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 900000).toISOString(),
      user: {
        id: 'test-user',
        name: 'Người kiểm thử',
        email: 'test@example.invalid',
      },
    })
  if (mode === 'expired') return reply({}, 401)
  if (path === '/api/auth/logout')
    return route.fulfill({ status: 204, headers })
  const projectWrite = path.match(/^\/api\/projects\/([^/]+)$/)
  if (projectWrite && method === 'PUT') {
    const i = projects.findIndex((p) => p.id === projectWrite[1])
    projects[i] = { ...projects[i], ...body }
    return reply(projects[i])
  }
  if (path === '/api/projects') {
    const p = Number(params.page || 0),
      size = Number(params.size || 100)
    return reply(
      envelope(
        projects.slice(p * size, (p + 1) * size),
        p,
        size,
        projects.length,
      ),
    )
  }
  if (path === '/api/dashboard/summary') {
    const rows = records.filter(
      (task) => !params.projectId || task.projectId === params.projectId,
    )
    const done = rows.filter((task) => task.status === 'DONE').length
    return reply({
      totalTasks: rows.length,
      todoTasks: rows.filter((task) => task.status === 'TODO').length,
      inProgressTasks: rows.filter((task) => task.status === 'IN_PROGRESS')
        .length,
      doneTasks: done,
      completionPercentage: rows.length
        ? Math.round((done / rows.length) * 10000) / 100
        : 0,
    })
  }
  if (path.startsWith('/api/dashboard/')) return reply(envelope([], 0, 4, 0))
  const list = path.match(/^\/api\/projects\/([^/]+)\/tasks$/)
  if (list && method === 'GET') {
    if (readDelay) await new Promise((done) => setTimeout(done, readDelay))
    if (mode === 'read-error' && params.status === 'TODO') return reply({}, 503)
    if (mode === 'page-error' && params.page === '1') return reply({}, 503)
    let rows = records.filter(
      (t) =>
        t.projectId === list[1] &&
        (!params.status || t.status === params.status) &&
        (!params.priority || t.priority === params.priority) &&
        (!params.search ||
          t.title.toLowerCase().includes(params.search.toLowerCase())),
    )
    rows.sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    )
    const p = Number(params.page || 0),
      size = Number(params.size || 20)
    return reply(
      envelope(rows.slice(p * size, (p + 1) * size), p, size, rows.length),
    )
  }
  if (method !== 'GET') {
    await new Promise((done) => setTimeout(done, 500))
    if (mode === 'conflict' && path.includes(id(101))) return reply({}, 409)
    if (mode === 'validation')
      return reply(
        {
          validationErrors: [
            { field: 'title', message: 'Internal diagnostic' },
          ],
        },
        400,
      )
  }
  if (list && method === 'POST') {
    const task = {
      ...body,
      id: id(nextId++),
      createdAt: '2026-11-23T14:00:00Z',
      updatedAt: '2026-11-23T14:00:00Z',
      completedAt: body.status === 'DONE' ? '2026-11-23T14:00:00Z' : null,
    }
    records.push(task)
    return reply(task, 201)
  }
  const match = path.match(/^\/api\/tasks\/([^/]+)(\/status)?$/)
  if (match) {
    const index = records.findIndex((task) => task.id === match[1])
    if (index === -1 || (method === 'GET' && mode === 'detail-missing'))
      return reply({}, 404)
    if (method === 'GET') {
      if (readDelay) await new Promise((done) => setTimeout(done, readDelay))
      return reply({
        ...records[index],
        description:
          records[index].description === 'Mô tả rút gọn từ danh sách.'
            ? 'Mô tả chi tiết từ API.\nDòng thứ hai được giữ nguyên.'
            : records[index].description,
      })
    }
    if (method === 'DELETE') {
      records.splice(index, 1)
      return route.fulfill({ status: 204, headers })
    }
    records[index] = {
      ...records[index],
      ...body,
      updatedAt: '2026-11-23T14:00:00Z',
      completedAt: body.status === 'DONE' ? '2026-11-23T14:00:00Z' : null,
    }
    return reply(records[index])
  }
  unexpected.push(path)
  return route.abort()
})
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (
    message.type() === 'error' &&
    !message.text().startsWith('Failed to load resource:')
  )
    errors.push(message.text())
})
const column = (status) =>
  page.locator(`.kanban-column[data-status="${status}"]`)
const card = (n) => page.locator(`.kanban-card[data-task-id="${id(n)}"]`)
const lists = () =>
  calls.filter(
    (c) =>
      c.method === 'GET' &&
      /^\/api\/projects\/[^/]+\/tasks$/.test(c.path) &&
      c.params.status,
  )
const drawer = () => page.locator('.task-drawer')
const editor = () => page.locator('.project-dialog')
const ready = async () => {
  await page.locator('.kanban-loaded-count').nth(2).waitFor()
  await page
    .locator('.kanban-column .task-skeleton')
    .waitFor({ state: 'hidden' })
}
async function drag(n, target) {
  await page.locator('.kanban-board').scrollIntoViewIfNeeded()
  const handle = card(n).locator('.kanban-drag-handle')
  await handle.scrollIntoViewIfNeeded()
  const start = await handle.boundingBox(),
    dest = await column(target).boundingBox()
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    start.x + start.width / 2 + 15,
    start.y + start.height / 2,
    { steps: 5 },
  )
  await page.mouse.move(
    dest.x + dest.width / 2,
    Math.max(100, start.y + start.height / 2),
    { steps: 15 },
  )
  await page.waitForTimeout(250)
  await page.mouse.up()
}
const nav = async (label) =>
  page
    .locator('.workspace-sidebar')
    .getByRole('link', { name: label, exact: true })
    .click()
const idle = async () =>
  page.locator('.kanban-pending').waitFor({ state: 'hidden' })
const count = async (status, total) => {
  /* global document */
  await page.waitForFunction(
    ({ status, total }) =>
      document.querySelector(
        `.kanban-column[data-status="${status}"] .kanban-column-count`,
      )?.textContent === String(total),
    { status, total },
  )
}
try {
  await page.goto(origin + '/login')
  await page.getByLabel('Email', { exact: true }).fill('test@example.invalid')
  await page
    .getByLabel('M\u1eadt kh\u1ea9u', { exact: true })
    .fill('test-only-password')
  await page
    .getByRole('button', { name: '\u0110\u0103ng nh\u1eadp', exact: true })
    .click()
  await page.waitForURL(origin + '/dashboard')
  await page.locator('.dashboard-loading').waitFor({ state: 'hidden' })
  await nav('Vi\u1ec7c c\u1ee7a t\u00f4i')
  await page.locator('.task-table tbody tr').first().waitFor()
  const catalogCalls = calls.filter(
    (c) => c.path === '/api/projects' && c.params.size === '100',
  ).length
  await nav('B\u1ea3ng Kanban')
  await ready()
  assert.equal(
    calls.filter((c) => c.path === '/api/projects' && c.params.size === '100')
      .length,
    catalogCalls,
  )
  const before = lists().length
  await drag(100, 'DONE')
  await count('DONE', 2)
  assert.equal(await card(100).getByRole('combobox').isDisabled(), true)
  assert.equal(await card(101).getByRole('combobox').isDisabled(), false)
  await idle()
  assert.equal(lists().length, before)
  assert.equal(records.find((t) => t.id === id(100)).status, 'DONE')
  console.log(
    'PASS pointer drag: immediate column/count update, one PATCH, zero board GETs, other cards enabled',
  )

  mode = 'conflict'
  await card(101).getByRole('combobox').selectOption('DONE')
  await column('DONE')
    .locator(`[data-task-id="${id(101)}"]`)
    .waitFor()
  await card(102).getByRole('combobox').selectOption('IN_PROGRESS')
  await idle()
  assert.equal(
    await column('TODO')
      .locator(`[data-task-id="${id(101)}"]`)
      .count(),
    1,
  )
  assert.equal(
    await column('IN_PROGRESS')
      .locator(`[data-task-id="${id(102)}"]`)
      .count(),
    1,
  )
  await page.locator('[data-sonner-toast][data-type="error"]').first().waitFor()
  mode = 'normal'
  console.log(
    'PASS concurrent cards: one failure rolls back without erasing the successful card; error toast visible',
  )

  const listsBeforeNavigation = calls.filter(
    (c) => c.path.endsWith('/tasks') && c.method === 'GET',
  ).length
  await nav('Vi\u1ec7c c\u1ee7a t\u00f4i')
  await page.locator('.task-table tbody tr').first().waitFor()
  assert.equal(
    calls.filter((c) => c.path.endsWith('/tasks') && c.method === 'GET').length,
    listsBeforeNavigation + 1,
  )
  assert.equal(await page.locator('.task-table tbody tr').count(), 6)
  await nav('B\u1ea3ng Kanban')
  await ready()
  const detailBefore = calls.filter(
    (c) => c.path === '/api/tasks/' + id(100),
  ).length
  await card(100).locator('.kanban-card-open').click()
  await drawer().getByRole('heading').first().waitFor()
  await drawer()
    .getByRole('button', {
      name: '\u0110\u00f3ng chi ti\u1ebft c\u00f4ng vi\u1ec7c',
      exact: true,
    })
    .click()
  await card(100).locator('.kanban-card-open').click()
  await drawer().getByRole('heading').first().waitFor()
  assert.equal(
    calls.filter((c) => c.path === '/api/tasks/' + id(100)).length,
    detailBefore,
  )
  await drawer()
    .getByRole('button', {
      name: '\u0110\u00f3ng chi ti\u1ebft c\u00f4ng vi\u1ec7c',
      exact: true,
    })
    .click()
  console.log('PASS cross-route cache and task-detail response reuse')

  readDelay = 900
  await page
    .getByRole('button', {
      name: 'T\u1ea3i l\u1ea1i d\u1ef1 \u00e1n',
      exact: true,
    })
    .click()
  assert.equal(await page.locator('.kanban-board').isVisible(), true)
  assert.equal(await page.locator('.kanban-page .task-skeleton').count(), 0)
  await nav('D\u1ef1 \u00e1n')
  await page.locator('.project-card').first().waitFor()
  const projectCard = page.locator('.project-card').first()
  const projectReads = calls.filter((c) => c.path === '/api/projects').length
  await projectCard
    .getByRole('button', { name: 'Ch\u1ec9nh s\u1eeda', exact: true })
    .click()
  await editor()
    .getByLabel('T\u00ean d\u1ef1 \u00e1n', { exact: true })
    .fill('Project updated')
  await editor()
    .getByRole('button', { name: 'L\u01b0u thay \u0111\u1ed5i', exact: true })
    .click()
  await editor().waitFor({ state: 'hidden' })
  await page
    .getByRole('link', { name: 'Project updated', exact: true })
    .waitFor()
  assert.equal(
    calls.filter((c) => c.path === '/api/projects').length,
    projectReads,
  )
  await nav('B\u1ea3ng Kanban')
  await page
    .getByRole('option', { name: 'Project updated', exact: true })
    .waitFor({ state: 'attached' })
  console.log(
    'PASS project edit updates pages/catalog without project GET; background refresh retains board',
  )

  // A partial server page must be refilled before the next offset is requested.
  readDelay = 0
  records.push(
    ...Array.from({ length: 25 }, (_, i) => ({
      ...records[0],
      id: id(500 + i),
      status: 'TODO',
      priority: 'HIGH',
      title: `Pagination fixture ${i}`,
      createdAt: new Date(Date.UTC(2026, 10, 23, 10, 0, -i)).toISOString(),
    })),
  )
  await page.getByLabel('Ưu tiên', { exact: true }).selectOption('HIGH')
  await count('TODO', 25)
  const beforePartial = lists().length
  await card(500).getByRole('combobox').selectOption('DONE')
  await count('TODO', 24)
  await idle()
  await page.waitForFunction(
    () =>
      document.querySelector(
        '.kanban-column[data-status="TODO"] .kanban-card-list',
      )?.children.length === 20,
  )
  assert.equal(lists().length, beforePartial + 1)
  await column('TODO')
    .getByRole('button', { name: 'Tải thêm công việc', exact: true })
    .click()
  await column('TODO')
    .locator(`[data-task-id="${id(524)}"]`)
    .waitFor()
  const loaded = await column('TODO')
    .locator('.kanban-card')
    .evaluateAll((cards) => cards.map((card) => card.dataset.taskId))
  assert.equal(loaded.length, 24)
  assert.equal(new Set(loaded).size, 24)
  console.log(
    'PASS partial column: one targeted refill GET, correct next offset and 24 unique remaining tasks',
  )

  readDelay = 900
  await nav('T\u1ed5ng quan')
  await page.locator('.dashboard-loading').waitFor({ state: 'hidden' })
  assert.equal(await page.locator('.dashboard').isVisible(), true)
  await page.locator('.user-menu-trigger').click()
  await page
    .getByRole('button', { name: '\u0110\u0103ng xu\u1ea5t', exact: true })
    .click()
  await page.waitForURL(origin + '/login')
  const beforeLogin = lists().length
  await page.getByLabel('Email', { exact: true }).fill('second@example.invalid')
  await page
    .getByLabel('M\u1eadt kh\u1ea9u', { exact: true })
    .fill('test-only-password')
  await page
    .getByRole('button', { name: '\u0110\u0103ng nh\u1eadp', exact: true })
    .click()
  await page.waitForURL(origin + '/dashboard')
  await nav('B\u1ea3ng Kanban')
  await ready()
  assert.equal(lists().length, beforeLogin + 3)
  assert.deepEqual(errors, [])
  assert.deepEqual(unexpected, [])
  console.log(
    'PASS logout clears cache; next login fetches fresh board. All requests intercepted; no production traffic.',
  )
} finally {
  await browser.close()
}
