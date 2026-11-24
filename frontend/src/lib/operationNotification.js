import { apiErrorMessage } from './apiErrorMessage.js'

export const operationMessages = {
  'auth.login': ['Đang đăng nhập…', 'Đăng nhập thành công!'],
  'auth.register': ['Đang tạo tài khoản…', 'Đăng ký tài khoản thành công!'],
  'project.create': ['Đang tạo dự án…', 'Tạo dự án thành công!'],
  'project.update': ['Đang cập nhật dự án…', 'Cập nhật dự án thành công!'],
  'project.archive': ['Đang lưu trữ dự án…', 'Đã lưu trữ dự án.'],
  'project.delete': ['Đang xóa dự án…', 'Xóa dự án thành công!'],
  'task.create': ['Đang tạo công việc…', 'Tạo công việc thành công!'],
  'task.update': ['Đang cập nhật công việc…', 'Cập nhật công việc thành công!'],
  'task.delete': ['Đang xóa công việc…', 'Xóa công việc thành công!'],
  'task.status': [
    'Đang cập nhật trạng thái…',
    'Đã cập nhật trạng thái công việc.',
  ],
}

export function startOperationNotification(
  notify,
  operation,
  timers = {
    setTimeout: (fn, delay) => setTimeout(fn, delay),
    clearTimeout: (id) => clearTimeout(id),
  },
) {
  const [loading, success] = operationMessages[operation]
  let id
  let finished = false
  const timer = timers.setTimeout(() => {
    if (!finished) id = notify.loading(loading)
  }, 500)
  function finish() {
    if (finished) return false
    finished = true
    timers.clearTimeout(timer)
    return true
  }
  return {
    success() {
      if (finish()) notify.success(success, id === undefined ? {} : { id })
    },
    error(error) {
      if (!finish()) return
      const message = apiErrorMessage(error, operation.split('.')[1])
      if (!message) {
        if (id !== undefined) notify.dismiss(id)
        return
      }
      const options = id === undefined ? {} : { id }
      if (operation === 'auth.register')
        notify.error('Đăng ký thất bại. Vui lòng thử lại.', {
          ...options,
          description: message,
        })
      else if (operation === 'task.status')
        notify.error('Không thể cập nhật trạng thái công việc.', {
          ...options,
          description: message,
        })
      else notify.error(message, options)
    },
    cancel() {
      if (finish() && id !== undefined) notify.dismiss(id)
    },
  }
}
