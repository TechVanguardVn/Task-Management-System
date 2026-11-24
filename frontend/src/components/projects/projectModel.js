export function projectForm(project) {
  return {
    name: project?.name ?? '',
    description: project?.description ?? '',
    color: project?.color ?? '',
    startDate: project?.startDate ?? '',
    dueDate: project?.dueDate ?? '',
  }
}

export function projectPayload(values, project) {
  return {
    name: values.name.trim(),
    description: values.description || null,
    color: values.color || null,
    startDate: values.startDate || null,
    dueDate: values.dueDate || null,
    status: project?.status ?? 'ACTIVE',
  }
}

export function validateProject(values) {
  const errors = {}
  if (!values.name.trim()) errors.name = 'Vui lòng nhập tên dự án.'
  else if (values.name.trim().length > 120)
    errors.name = 'Tên dự án không được vượt quá 120 ký tự.'
  if (values.description.length > 10000)
    errors.description = 'Mô tả không được vượt quá 10.000 ký tự.'
  if (values.color.length > 32)
    errors.color = 'Màu không được vượt quá 32 ký tự.'
  if (values.startDate && values.dueDate && values.dueDate < values.startDate)
    errors.dueDate = 'Hạn hoàn thành phải bằng hoặc sau ngày bắt đầu.'
  return errors
}

export function visibleProjects(projects, search, status, sort) {
  const query = search.trim().toLocaleLowerCase('vi-VN')
  const result = projects.filter(
    (project) =>
      project.name.toLocaleLowerCase('vi-VN').includes(query) &&
      (status === 'ALL' || project.status === status),
  )
  const [field, direction] = sort.split(':')
  return result.sort((a, b) => {
    if (!a[field] && b[field]) return 1
    if (a[field] && !b[field]) return -1
    const order = String(a[field] || '').localeCompare(String(b[field] || ''))
    return (direction === 'asc' ? order : -order) || a.id.localeCompare(b.id)
  })
}

export function projectError(error) {
  const status = error.response?.status
  if (status === 404)
    return 'Không tìm thấy dự án hoặc bạn không có quyền truy cập.'
  if (status === 403) return 'Bạn không có quyền thực hiện thao tác này.'
  if (status === 409)
    return 'Dữ liệu đã thay đổi hoặc đang được xử lý. Vui lòng tải lại danh sách trước khi thử lại.'
  if (status === 400)
    return 'Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường bên dưới.'
  return 'Chưa thể hoàn tất yêu cầu. Vui lòng kiểm tra kết nối và tải lại danh sách trước khi thử lại.'
}

export function projectFieldErrors(error) {
  const messages = {
    name: 'Tên dự án chưa hợp lệ (tối đa 120 ký tự).',
    description: 'Mô tả không được vượt quá 10.000 ký tự.',
    color: 'Màu không được vượt quá 32 ký tự.',
    startDate: 'Ngày bắt đầu chưa hợp lệ.',
    dueDate: 'Hạn hoàn thành chưa hợp lệ.',
    dateRangeValid: 'Hạn hoàn thành phải bằng hoặc sau ngày bắt đầu.',
  }
  const errors = {}
  const entries = error.response?.data?.validationErrors
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (entry && Object.hasOwn(messages, entry.field))
      errors[entry.field === 'dateRangeValid' ? 'dueDate' : entry.field] =
        messages[entry.field]
  }
  return errors
}
