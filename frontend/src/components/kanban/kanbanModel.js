import { taskStatuses } from '../tasks/taskModel.js'

export const columnTitles = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Đã hoàn thành',
}
export const columnPageSize = 20

export function columnQuery(status, search, priority, page = 0) {
  return {
    status,
    search,
    priority,
    page,
    size: columnPageSize,
    sort: 'createdAt,desc',
  }
}

export function mergeTasks(previous, incoming) {
  return [
    ...new Map(
      [...previous, ...incoming].map((task) => [task.id, task]),
    ).values(),
  ]
}

export function orderedTasks(tasks) {
  const subMillisecond = (value) =>
    (value?.match(/\.(\d+)(?:Z|[+-]\d{2}:\d{2})$/)?.[1] || '')
      .padEnd(9, '0')
      .slice(3)
  return [...tasks].sort(
    (a, b) =>
      (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0) ||
      subMillisecond(b.createdAt).localeCompare(subMillisecond(a.createdAt)) ||
      a.id.localeCompare(b.id),
  )
}

// A pending move changes only the displayed status; timestamps always come from the server.
export function columnTasks(tasks, status, pending) {
  if (!pending) return orderedTasks(tasks)
  const remaining = tasks.filter((task) => task.id !== pending.task.id)
  return orderedTasks(
    pending.status === status
      ? [...remaining, { ...pending.task, status }]
      : remaining,
  )
}

export function canMove(task, status, locked, pending) {
  return Boolean(
    task &&
    !locked &&
    !pending &&
    taskStatuses.includes(status) &&
    task.status !== status,
  )
}

export function timestamp(value) {
  if (!value) return 'Chưa có'
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Chưa có'
    : new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
}
