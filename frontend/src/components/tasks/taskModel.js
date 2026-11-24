export const defaultTaskQuery = {
  search: '',
  status: '',
  priority: '',
  sort: 'dueDate,asc',
  page: 0,
  size: 10,
}
export const taskStatuses = ['TODO', 'IN_PROGRESS', 'DONE']
export const taskPriorities = ['LOW', 'MEDIUM', 'HIGH']

export function taskForm(task, projectId) {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    projectId: task?.projectId ?? projectId,
    status: task?.status ?? 'TODO',
    priority: task?.priority ?? 'MEDIUM',
    dueDate: task?.dueDate ?? '',
  }
}

export function taskPayload(values) {
  return {
    title: values.title.trim(),
    description: values.description || null,
    projectId: values.projectId,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate || null,
  }
}

export function validateTask(values, projects, sourceId) {
  const errors = {}
  if (!values.title.trim()) errors.title = 'Vui lòng nhập tên công việc.'
  else if (values.title.trim().length > 255)
    errors.title = 'Tên công việc không được vượt quá 255 ký tự.'
  if (values.description.length > 10000)
    errors.description = 'Mô tả không được vượt quá 10.000 ký tự.'
  const target = projects.find((project) => project.id === values.projectId)
  if (!target) errors.projectId = 'Vui lòng chọn dự án của bạn.'
  else if (target.status !== 'ACTIVE')
    errors.projectId = 'Không thể ghi công việc vào dự án đã lưu trữ.'
  if (
    sourceId &&
    projects.find((project) => project.id === sourceId)?.status !== 'ACTIVE'
  )
    errors.projectId =
      'Không thể sửa hoặc chuyển công việc từ dự án đã lưu trữ.'
  if (!taskStatuses.includes(values.status))
    errors.status = 'Trạng thái chưa hợp lệ.'
  if (!taskPriorities.includes(values.priority))
    errors.priority = 'Mức ưu tiên chưa hợp lệ.'
  if (values.dueDate) {
    const date = new Date(`${values.dueDate}T12:00:00Z`)
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== values.dueDate
    )
      errors.dueDate = 'Vui lòng nhập ngày hợp lệ.'
  }
  return errors
}

export function dueIndicator(task, now = new Date()) {
  if (!task.dueDate || task.status === 'DONE') return null
  const [year, month, day] = task.dueDate.split('-').map(Number)
  const due = new Date(year, month - 1, day)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)
  if (due < today) return { kind: 'overdue', label: 'Quá hạn' }
  if (due <= nextWeek) return { kind: 'upcoming', label: 'Sắp đến hạn' }
  return null
}

export function taskError(error) {
  const status = error.response?.status
  if (status === 404)
    return 'Không tìm thấy công việc hoặc dự án, hoặc bạn không có quyền truy cập.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 409)
    return 'Không thể thay đổi công việc. Dự án có thể đã lưu trữ hoặc dữ liệu vừa thay đổi. Vui lòng tải lại trước khi thử lại.'
  if (status === 400)
    return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra biểu mẫu.'
  return 'Chưa thể hoàn tất yêu cầu. Vui lòng kiểm tra kết nối và tải lại dữ liệu trước khi thử lại.'
}

export function taskFieldErrors(error) {
  const messages = {
    title: 'Tên công việc chưa hợp lệ (tối đa 255 ký tự).',
    description: 'Mô tả chưa hợp lệ (tối đa 10.000 ký tự).',
    projectId: 'Dự án chưa hợp lệ hoặc không cho phép ghi công việc.',
    status: 'Trạng thái chưa hợp lệ.',
    priority: 'Mức ưu tiên chưa hợp lệ.',
    dueDate: 'Ngày hoàn thành chưa hợp lệ.',
  }
  const entries = error.response?.data?.validationErrors
  return Object.fromEntries(
    (Array.isArray(entries) ? entries : [])
      .filter((item) => item && Object.hasOwn(messages, item.field))
      .map((item) => [item.field, messages[item.field]]),
  )
}
