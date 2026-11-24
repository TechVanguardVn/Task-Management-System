import assert from 'node:assert/strict'
import { randomUUID, createHmac } from 'node:crypto'
import { chromium } from 'playwright'

const api = process.env.FE08_LOCAL_API,
  web = process.env.FE08_LOCAL_WEB
for (const value of [api, web]) {
  const url = new URL(value)
  if (
    url.protocol !== 'http:' ||
    url.hostname !== '127.0.0.1' ||
    !url.port ||
    url.pathname !== '/'
  )
    throw new Error('Only disposable loopback services are permitted.')
}
if (process.env.FE08_DISPOSABLE !== 'true' || !process.env.FE08_TEST_JWT_SECRET)
  throw new Error('Use scripts/Test-FrontendIntegration.ps1.')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
})
const page = await context.newPage()
page.setDefaultTimeout(20000)
const errors = [],
  requests = []
await context.route('**/*', (route) => {
  if (![api, web].includes(new URL(route.request().url()).origin)) {
    errors.push('External request blocked')
    return route.abort()
  }
  return route.continue()
})
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (
    message.type() === 'error' &&
    !message.text().startsWith('Failed to load resource:')
  )
    errors.push(message.text())
})
page.on('request', (request) => {
  if (request.url().startsWith(api))
    requests.push({
      path: new URL(request.url()).pathname,
      method: request.method(),
    })
})
let currentAuth
page.on('response', async (response) => {
  if (response.ok() && /\/api\/auth\/(login|register)$/.test(response.url()))
    currentAuth = await response.json()
})
const password = `Local-only-${randomUUID()}`
const email = `fe08-${randomUUID()}@example.invalid`
const secondEmail = `fe08-${randomUUID()}@example.invalid`
const editor = () => page.locator('.project-dialog')
async function json(
  path,
  { method = 'GET', body, token = currentAuth?.accessToken } = {},
) {
  const response = await fetch(api + path, {
    method,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(body && { 'Content-Type': 'application/json' }),
    },
    ...(body && { body: JSON.stringify(body) }),
  })
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
  }
}
async function nav(label) {
  if (await page.locator('.mobile-nav-toggle').isVisible()) {
    await page
      .getByRole('button', { name: 'Mở điều hướng', exact: true })
      .click()
    await page
      .locator('#mobile-navigation')
      .getByRole('link', { name: label, exact: true })
      .click()
  } else
    await page
      .locator('.workspace-sidebar')
      .getByRole('link', { name: label, exact: true })
      .click()
  const target = {
    'Tổng quan': ['/dashboard', '.dashboard-heading'],
    'Dự án': ['/projects', '.projects-page'],
    'Việc của tôi': ['/tasks', '.tasks-page'],
    'Bảng Kanban': ['/kanban', '.kanban-heading'],
  }[label]
  await page.waitForURL((url) => url.pathname === target[0])
  await page.locator(target[1]).waitFor()
}
async function logout() {
  await page.locator('.user-menu-trigger').click()
  await page.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await page.waitForURL(web + '/login')
}
async function login(account) {
  await page.getByLabel('Email', { exact: true }).fill(account)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  const response = page.waitForResponse(
    (response) =>
      response.url() === api + '/api/auth/login' &&
      response.request().method() === 'POST',
  )
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  const authenticated = await response
  assert.equal(authenticated.status(), 200)
  currentAuth = await authenticated.json()
  await page.waitForURL(web + '/dashboard')
}
async function createProject(name) {
  await nav('Dự án')
  await page.getByRole('button', { name: /Tạo dự án mới/ }).click()
  await editor().getByLabel('Tên dự án', { exact: true }).fill(name)
  await editor()
    .getByLabel('Mô tả (không bắt buộc)', { exact: true })
    .fill('Local integration description')
  await editor()
    .getByLabel('Màu dự án (không bắt buộc)', { exact: true })
    .fill('#10b981')
  await editor().getByLabel('Ngày bắt đầu', { exact: true }).fill('2026-01-01')
  await editor()
    .getByLabel('Hạn hoàn thành', { exact: true })
    .fill('2099-12-31')
  const response = page.waitForResponse(
    (response) =>
      response.url() === api + '/api/projects' &&
      response.request().method() === 'POST',
  )
  await editor().getByRole('button', { name: 'Tạo dự án', exact: true }).click()
  const actual = await response
  assert.equal(actual.status(), 201)
  await editor().waitFor({ state: 'hidden' })
  return actual.json()
}
async function createTask(projectId, title, dueDate) {
  await nav('Việc của tôi')
  await page
    .getByRole('button', { name: '+ Thêm công việc', exact: true })
    .click()
  await editor().getByLabel('Dự án', { exact: true }).selectOption(projectId)
  await editor().getByLabel('Tên công việc', { exact: true }).fill(title)
  await editor()
    .getByLabel('Hạn hoàn thành (không bắt buộc)', { exact: true })
    .fill(dueDate)
  await editor().getByLabel('Ưu tiên', { exact: true }).selectOption('HIGH')
  const response = page.waitForResponse(
    (response) =>
      response.url() === api + `/api/projects/${projectId}/tasks` &&
      response.request().method() === 'POST',
  )
  await editor()
    .getByRole('button', { name: 'Thêm công việc', exact: true })
    .click()
  const actual = await response
  assert.equal(actual.status(), 201)
  await editor().waitFor({ state: 'hidden' })
  return actual.json()
}
const card = (task) => page.locator(`[data-task-id="${task.id}"]`)
async function status(task, value) {
  const response = page.waitForResponse(
    (response) =>
      response.url() === api + `/api/tasks/${task.id}/status` &&
      response.request().method() === 'PATCH',
  )
  await card(task).getByRole('combobox').selectOption(value)
  assert.equal((await response).status(), 200)
  await page.locator('.kanban-pending').waitFor({ state: 'hidden' })
  const persisted = (await json(`/api/tasks/${task.id}`)).data
  assert.equal(persisted.status, value)
  assert.equal(Boolean(persisted.completedAt), value === 'DONE')
}
/* global document, history, innerWidth, location */
try {
  for (const path of [
    '/login',
    '/register',
    '/dashboard',
    '/projects',
    '/tasks',
    '/kanban',
  ]) {
    const response = await page.goto(web + path)
    assert.equal(response.status(), 200)
    await page.reload()
    if (!['/login', '/register'].includes(path))
      await page.waitForURL(web + '/login')
  }
  await page.goto(web + '/register')
  await page.getByLabel('Họ và tên', { exact: true }).fill('Integration User')
  await page.getByLabel('Email', { exact: true }).fill(email)
  await page.getByLabel('Mật khẩu', { exact: true }).fill(password)
  await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill(password)
  await page
    .getByRole('button', { name: 'Đăng ký tài khoản', exact: true })
    .click()
  await page.waitForURL(web + '/dashboard')
  await logout()
  const beforeLogin = requests.filter(
    (request) => request.path === '/api/auth/login',
  ).length
  await login(email)
  assert.equal(
    requests.filter((request) => request.path === '/api/auth/login').length,
    beforeLogin + 1,
  )
  assert.equal((await json('/api/auth/me')).status, 200)
  await page.reload()
  await page.locator('.dashboard-heading').waitFor()
  assert.equal(
    requests.filter((request) => request.path === '/api/auth/login').length,
    beforeLogin + 1,
  )
  assert.ok(requests.some((request) => request.path === '/api/auth/me'))
  console.log(
    'PASS real backend registration/login/me, protected direct routes, reload restoration and one login request',
  )

  const a = await createProject('Integration Alpha'),
    b = await createProject('Integration Beta')
  assert.equal((await json(`/api/projects/${a.id}`)).data.color, '#10b981')
  const first = await createTask(a.id, 'Integration overdue', '2000-01-01')
  const future = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10)
  const second = await createTask(b.id, 'Integration upcoming', future)
  for (let i = 0; i < 10; i++)
    assert.equal(
      (
        await json(`/api/projects/${a.id}/tasks`, {
          method: 'POST',
          body: {
            title: `Paging ${i}`,
            projectId: a.id,
            status: 'TODO',
            priority: 'LOW',
          },
        })
      ).status,
      201,
    )
  await page
    .getByRole('button', { name: 'Tải lại công việc', exact: true })
    .click()
  await page.waitForFunction(() =>
    document
      .querySelector('.task-pagination')
      ?.textContent.includes('12 công việc phù hợp'),
  )
  assert.equal(
    await page.getByLabel('Dự án đang xem', { exact: true }).inputValue(),
    'all',
  )
  await page.getByRole('button', { name: 'Sau', exact: true }).click()
  assert.equal(await page.locator('.task-table tbody tr').count(), 2)
  await page
    .getByLabel('Tìm theo tên công việc', { exact: true })
    .fill('Integration')
  await page.waitForFunction(() =>
    document
      .querySelector('.task-pagination')
      ?.textContent.includes('2 công việc phù hợp'),
  )
  await page.getByLabel('Ưu tiên', { exact: true }).selectOption('HIGH')
  assert.equal(await page.locator('.task-table tbody tr').count(), 2)
  await page.getByLabel('Dự án đang xem', { exact: true }).selectOption(b.id)
  await page.waitForFunction(() =>
    document
      .querySelector('.task-pagination')
      ?.textContent.includes('1 công việc phù hợp'),
  )
  await nav('Tổng quan')
  await page.waitForFunction(
    () =>
      document.querySelector('[data-count="totalTasks"]')?.textContent === '12',
  )
  await page.getByRole('link', { name: first.title, exact: true }).waitFor()
  await page.getByRole('link', { name: second.title, exact: true }).waitFor()
  console.log(
    'PASS project/task creation, actual names/colors/dates, All Projects filtering/pagination and real dashboard deadlines/counts',
  )

  await nav('Bảng Kanban')
  await page.getByLabel('Dự án đang xem', { exact: true }).selectOption(a.id)
  await card(first).waitFor()
  const dragged = page.waitForResponse(
    (response) =>
      response.url() === api + `/api/tasks/${first.id}/status` &&
      response.request().method() === 'PATCH',
  )
  const handle = card(first).locator('.kanban-drag-handle')
  await handle.scrollIntoViewIfNeeded()
  const start = await handle.boundingBox()
  const destination = await page
    .locator('.kanban-column[data-status="IN_PROGRESS"]')
    .boundingBox()
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    start.x + start.width / 2 + 15,
    start.y + start.height / 2,
    { steps: 5 },
  )
  await page.mouse.move(
    destination.x + destination.width / 2,
    start.y + start.height / 2,
    { steps: 15 },
  )
  await page
    .locator('.kanban-column-target[data-status="IN_PROGRESS"]')
    .waitFor()
  await page.mouse.up()
  assert.equal((await dragged).status(), 200)
  await page.locator('.kanban-pending').waitFor({ state: 'hidden' })
  assert.equal(
    (await json(`/api/tasks/${first.id}`)).data.status,
    'IN_PROGRESS',
  )
  await status(first, 'DONE')
  await status(first, 'TODO')
  await status(first, 'IN_PROGRESS')
  await page.reload()
  await card(first).waitFor()
  assert.equal(
    await card(first).getByRole('combobox').inputValue(),
    'IN_PROGRESS',
  )
  await card(first).locator('.kanban-card-open').click()
  const drawer = page.locator('.task-drawer')
  await drawer
    .getByRole('button', { name: 'Chỉnh sửa công việc', exact: true })
    .click()
  await editor()
    .getByLabel('Mô tả (không bắt buộc)', { exact: true })
    .fill('Updated through drawer')
  await editor()
    .getByRole('button', { name: 'Lưu thay đổi', exact: true })
    .click()
  await editor().waitFor({ state: 'hidden' })
  assert.equal(
    (await json(`/api/tasks/${first.id}`)).data.description,
    'Updated through drawer',
  )
  await drawer
    .getByRole('button', { name: 'Đóng chi tiết công việc', exact: true })
    .click()

  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const label of ['Tổng quan', 'Dự án', 'Việc của tôi', 'Bảng Kanban']) {
      await nav(label)
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
    }
    await page.getByLabel('Dự án đang xem', { exact: true }).selectOption(a.id)
    await card(first).locator('.kanban-card-open').click()
    assert.ok(
      await drawer.evaluate((element) => {
        const rect = element.getBoundingClientRect()
        return rect.x >= -1 && rect.right <= innerWidth + 1
      }),
    )
    await drawer
      .getByRole('button', { name: 'Chỉnh sửa công việc', exact: true })
      .click()
    assert.ok(
      await editor().evaluate(
        (element) => element.getBoundingClientRect().right <= innerWidth + 1,
      ),
    )
    await editor().getByRole('button', { name: 'Hủy', exact: true }).click()
    await drawer
      .getByRole('button', { name: 'Đóng chi tiết công việc', exact: true })
      .click()
  }
  console.log(
    'PASS status transitions/completion timestamps/persistence, drawer edits and 375/768/1440 navigation, pages and modals without document overflow',
  )

  await page.getByLabel('Dự án đang xem', { exact: true }).selectOption(b.id)
  await card(second).locator('.kanban-card-open').click()
  await drawer
    .getByRole('button', { name: 'Xóa công việc', exact: true })
    .click()
  await editor()
    .getByRole('button', { name: 'Xóa vĩnh viễn', exact: true })
    .click()
  await editor().waitFor({ state: 'hidden' })
  assert.equal((await json(`/api/tasks/${second.id}`)).status, 404)
  const other = await json('/api/auth/register', {
    method: 'POST',
    token: null,
    body: { name: 'Second User', email: secondEmail, password },
  })
  assert.equal(other.status, 201)
  assert.equal(
    (await json(`/api/projects/${a.id}`, { token: other.data.accessToken }))
      .status,
    404,
  )
  assert.equal(
    (await json(`/api/tasks/${first.id}`, { token: other.data.accessToken }))
      .status,
    404,
  )
  await nav('Dự án')
  const projectCard = page
    .locator('.project-card')
    .filter({ hasText: 'Integration Alpha' })
  await projectCard
    .getByRole('button', { name: 'Chỉnh sửa', exact: true })
    .click()
  await editor()
    .getByLabel('Tên dự án', { exact: true })
    .fill('Integration Alpha Updated')
  await editor()
    .getByRole('button', { name: 'Lưu thay đổi', exact: true })
    .click()
  await editor().waitFor({ state: 'hidden' })
  await projectCard
    .getByRole('button', { name: 'Lưu trữ', exact: true })
    .click()
  await editor()
    .getByRole('button', { name: 'Lưu trữ dự án', exact: true })
    .click()
  await editor().waitFor({ state: 'hidden' })
  await nav('Bảng Kanban')
  await page.getByLabel('Dự án đang xem', { exact: true }).selectOption(a.id)
  assert.equal(await card(first).getByRole('combobox').isDisabled(), true)
  assert.equal(
    (
      await json(`/api/tasks/${first.id}/status`, {
        method: 'PATCH',
        body: { status: 'DONE' },
      })
    ).status,
    409,
  )
  await nav('Dự án')
  await projectCard.getByRole('button', { name: 'Xóa', exact: true }).click()
  await editor()
    .getByRole('button', { name: 'Xóa vĩnh viễn', exact: true })
    .click()
  await editor().waitFor({ state: 'hidden' })
  assert.equal((await json(`/api/tasks/${first.id}`)).status, 404)
  const previousToken = currentAuth.accessToken
  await logout()
  assert.equal(
    (await json('/api/auth/me', { token: previousToken })).status,
    401,
  )
  assert.equal(
    await page.evaluate(
      () =>
        Object.keys(sessionStorage).filter((key) =>
          key.startsWith('taskflow.session.'),
        ).length,
    ),
    0,
  )
  await login(secondEmail)
  await page.waitForFunction(
    () =>
      document.querySelector('[data-count="totalTasks"]')?.textContent === '0',
  )
  await nav('Việc của tôi')
  await page
    .getByText('Bạn cần tạo dự án trước khi thêm công việc.', { exact: true })
    .waitFor()
  await logout()

  const encoded = (value) =>
    Buffer.from(JSON.stringify(value)).toString('base64url')
  const expired = `${encoded({ alg: 'HS256', typ: 'JWT' })}.${encoded({ iss: 'task-management-system', aud: ['task-management-api'], sub: other.data.user.id, jti: randomUUID(), iat: 1, nbf: 1, exp: 2 })}`
  const expiredToken = `${expired}.${createHmac('sha256', Buffer.from(process.env.FE08_TEST_JWT_SECRET, 'base64')).update(expired).digest('base64url')}`
  assert.equal(
    (await json('/api/auth/me', { token: expiredToken })).status,
    401,
  )
  assert.equal(
    (await json('/api/auth/me', { token: 'invalid-test-token' })).status,
    401,
  )
  await page.evaluate(
    ({ token, api }) => {
      sessionStorage.setItem(
        `taskflow.session.v1:${api}`,
        JSON.stringify({
          accessToken: token,
          expiresAt: new Date(Date.now() + 60000).toISOString(),
        }),
      )
      history.replaceState(null, '', '/dashboard')
    },
    { token: expiredToken, api },
  )
  await page.reload()
  await page.waitForURL(web + '/login')
  assert.ok((await page.locator('[data-sonner-toaster]').count()) <= 1)
  assert.ok(
    (await page.locator('[data-sonner-toast][data-type="warning"]').count()) <=
      1,
  )
  assert.equal(
    await page.evaluate(
      () =>
        Object.keys(sessionStorage).filter((key) =>
          key.startsWith('taskflow.session.'),
        ).length,
    ),
    0,
  )
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of ['/login', '/register']) {
      await page.goto(web + path)
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth + 1,
        ),
      )
    }
  }
  assert.deepEqual(errors, [])
  console.log(
    'PASS ownership isolation/404, project edit/archive/delete/cascade, archived write 409, logout revocation/storage/cache isolation and invalid/expired JWT handling',
  )
  console.log(
    'All writes used the disposable loopback database; browser CORS verified only for the local preview origin. Production not modified.',
  )
} catch (error) {
  console.log(
    'Local browser diagnostic',
    await page.evaluate(() => ({
      path: location.pathname + location.search,
      viewport: innerWidth,
      projects: [...document.querySelectorAll('select')].map((element) => ({
        id: element.id,
        value: element.value,
      })),
      cards: [...document.querySelectorAll('[data-task-id]')].map(
        (element) => element.dataset.taskId,
      ),
      alerts: [...document.querySelectorAll('[role="alert"]')].map(
        (element) => element.textContent,
      ),
    })),
  )
  await page.screenshot({
    path: 'node_modules/.cache/fe08-failure.png',
    fullPage: true,
  })
  throw error
} finally {
  await browser.close()
}
