import assert from 'node:assert/strict'
import test from 'node:test'
import { createNotify } from '../src/lib/createNotify.js'
import {
  apiErrorMessage,
  mutationRecovery,
} from '../src/lib/apiErrorMessage.js'
import {
  startOperationNotification,
  operationMessages,
} from '../src/lib/operationNotification.js'

function fixture() {
  let nextId = 0
  const jobs = new Map(),
    calls = []
  const timers = {
    setTimeout: (fn, delay) => {
      const id = ++nextId
      jobs.set(id, { fn, delay })
      return id
    },
    clearTimeout: (id) => jobs.delete(id),
  }
  const driver = Object.fromEntries(
    ['success', 'error', 'warning', 'info', 'loading', 'dismiss'].map(
      (type) => [
        type,
        (message, options = {}) => {
          const id = options.id ?? `toast-${++nextId}`
          calls.push({ type, message, options, id })
          return id
        },
      ],
    ),
  )
  const notify = createNotify(driver, timers)
  const tick = (delay) => {
    for (const [id, job] of [...jobs])
      if (job.delay === delay) {
        jobs.delete(id)
        job.fn()
      }
  }
  return { calls, jobs, timers, notify, tick }
}

test('safe error helper maps HTTP, network, timeout and auth contexts without raw server details', () => {
  for (const status of [400, 401, 403, 404, 409, 422, 429, 500, 503]) {
    const message = apiErrorMessage({
      response: {
        status,
        data: {
          message: 'SQL SECRET TOKEN',
          validationErrors: [{ field: 'title', message: 'SQL SECRET' }],
        },
      },
    })
    assert.ok(message)
    assert.equal(message.includes('SECRET'), false)
  }
  assert.equal(apiErrorMessage({}), 'Không thể kết nối đến máy chủ.')
  assert.match(apiErrorMessage({ code: 'ECONNABORTED' }), /quá chậm/)
  assert.equal(
    apiErrorMessage({ response: { status: 401 } }, 'login'),
    'Email hoặc mật khẩu không chính xác.',
  )
  assert.match(
    apiErrorMessage({ response: { status: 409 } }, 'register'),
    /đã được sử dụng/,
  )
  assert.equal(apiErrorMessage({ code: 'ERR_CANCELED' }), null)
  assert.equal(apiErrorMessage({ name: 'AbortError' }), null)
  assert.match(mutationRecovery({ response: { status: 400 } }), /biểu mẫu/)
  assert.match(mutationRecovery({}), /tải lại/)
})
test('utility forwards descriptions/durations and all required notification types', () => {
  const { notify, calls } = fixture()
  for (const type of ['success', 'error', 'warning', 'info'])
    notify[type]('Thông báo', { description: 'Chi tiết', duration: 1800 })
  assert.deepEqual(
    calls.map((call) => call.type),
    ['success', 'error', 'warning', 'info'],
  )
  assert.ok(
    calls.every(
      (call) =>
        call.options.description === 'Chi tiết' &&
        call.options.duration === 1800,
    ),
  )
})
test('direct loading notifications have a finite watchdog even for an infinite requested duration', () => {
  const { notify, calls, tick, jobs } = fixture()
  const id = notify.loading('Đang xử lý', { duration: Infinity })
  tick(30000)
  assert.equal(calls.at(-1).type, 'dismiss')
  assert.equal(calls.at(-1).message, id)
  assert.equal(jobs.size, 0)
})
test('replacing or dismissing loading notifications clears their watchdog', () => {
  const { notify, jobs, calls } = fixture()
  const id = notify.loading('Đang tải')
  notify.success('Đã xong', { id })
  assert.equal(jobs.size, 0)
  notify.loading('Đang xóa')
  notify.loading('Đang lưu')
  notify.dismiss()
  assert.equal(jobs.size, 0)
  assert.equal(calls.at(-1).type, 'dismiss')
})
test('fast operations produce only one success after completion and no loading toast', () => {
  const { notify, timers, calls, jobs, tick } = fixture()
  const operation = startOperationNotification(notify, 'task.create', timers)
  assert.equal(calls.length, 0)
  operation.success()
  operation.success()
  operation.cancel()
  tick(500)
  assert.deepEqual(
    calls.map((call) => [call.type, call.message]),
    [['success', 'Tạo công việc thành công!']],
  )
  assert.equal(jobs.size, 0)
})
test('slow operation replaces its loading ID on success, without a duplicate toast or timer', () => {
  const { notify, timers, calls, jobs, tick } = fixture()
  const operation = startOperationNotification(notify, 'project.delete', timers)
  tick(500)
  const id = calls[0].id
  assert.equal(calls[0].type, 'loading')
  operation.success()
  assert.equal(calls[1].options.id, id)
  assert.equal(calls[1].options.duration, 3500)
  assert.equal(calls[1].message, 'Xóa dự án thành công!')
  assert.equal(jobs.size, 0)
})
test('failed slow operation replaces loading with a safe error and never emits success', () => {
  const { notify, timers, calls, jobs, tick } = fixture()
  const operation = startOperationNotification(notify, 'task.status', timers)
  tick(500)
  operation.error({
    response: { status: 409, data: { message: 'PRIVATE SQL' } },
  })
  operation.success()
  operation.error({})
  assert.deepEqual(
    calls.map((call) => call.type),
    ['loading', 'error'],
  )
  assert.equal(calls[1].options.id, calls[0].id)
  assert.equal(calls[1].message.includes('PRIVATE'), false)
  assert.equal(jobs.size, 0)
})
test('cancel on unmount/session change clears delayed or active loading without any completion toast', () => {
  for (const slow of [false, true]) {
    const { notify, timers, calls, jobs, tick } = fixture()
    const operation = startOperationNotification(
      notify,
      'project.create',
      timers,
    )
    if (slow) tick(500)
    operation.cancel()
    operation.success()
    operation.error({})
    tick(500)
    assert.deepEqual(
      calls.map((call) => call.type),
      slow ? ['loading', 'dismiss'] : [],
    )
    assert.equal(jobs.size, 0)
  }
})
test('canceled Axios requests do not produce an error notification', () => {
  const { notify, timers, calls, tick } = fixture()
  const operation = startOperationNotification(notify, 'task.update', timers)
  tick(500)
  operation.error({ code: 'ERR_CANCELED' })
  assert.deepEqual(
    calls.map((call) => call.type),
    ['loading', 'dismiss'],
  )
})
test('registration failure uses its requested title and a safe explanatory description', () => {
  const { notify, timers, calls } = fixture()
  startOperationNotification(notify, 'auth.register', timers).error({
    response: { status: 409 },
  })
  assert.equal(calls[0].message, 'Đăng ký thất bại. Vui lòng thử lại.')
  assert.match(calls[0].options.description, /đã được sử dụng/)
})
test('every integrated operation has a single success and loading message', () => {
  assert.deepEqual(Object.keys(operationMessages).sort(), [
    'auth.login',
    'auth.register',
    'project.archive',
    'project.create',
    'project.delete',
    'project.update',
    'task.create',
    'task.delete',
    'task.status',
    'task.update',
  ])
  assert.ok(
    Object.values(operationMessages).every(
      (messages) => messages.length === 2 && messages.every(Boolean),
    ),
  )
})
