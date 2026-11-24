export const statusLabels = {
  TODO: 'Cần thực hiện',
  IN_PROGRESS: 'Đang tiến hành',
  DONE: 'Đã hoàn thành',
}
export const priorityLabels = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }

export function greetingAt(date) {
  const hour = date.getHours()
  return hour < 12
    ? 'Chào buổi sáng'
    : hour < 18
      ? 'Chào buổi chiều'
      : 'Chào buổi tối'
}

export function shortName(name) {
  return typeof name === 'string'
    ? name.trim().split(/\s+/u).filter(Boolean).at(-1) || ''
    : ''
}

export function formatCount(value) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatPercent(value) {
  return (
    new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 2 }).format(value) +
    '%'
  )
}

export function formatDueDate(value) {
  if (!value) return 'Chưa đặt hạn'
  const [year, month, day] = value.split('-').map(Number)
  // Date-only deadlines are calendar dates, not UTC instants.
  const date = new Date(year, month - 1, day)
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function distribution(summary) {
  return [
    { status: 'DONE', count: summary.doneTasks, color: '#6366f1' },
    { status: 'IN_PROGRESS', count: summary.inProgressTasks, color: '#9694ff' },
    { status: 'TODO', count: summary.todoTasks, color: '#c7c9e0' },
  ].map((item) => ({
    ...item,
    label: statusLabels[item.status],
    percentage: summary.totalTasks
      ? (item.count / summary.totalTasks) * 100
      : 0,
  }))
}
