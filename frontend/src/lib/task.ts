import type { Task, TaskPriority, TaskStatus } from '../types'

export const statusLabel: Record<TaskStatus, string> = { TODO: 'Cần làm', IN_PROGRESS: 'Đang làm', DONE: 'Hoàn thành' }
export const priorityLabel: Record<TaskPriority, string> = { LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao' }

export function isOverdue(task: Task, today = new Date()): boolean {
  if (!task.dueDate || task.status === 'DONE') return false
  const due = new Date(`${task.dueDate}T00:00:00`)
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return due < current
}

export function daysUntil(dueDate?: string | null): number | null {
  if (!dueDate) return null
  const due = new Date(`${dueDate}T00:00:00`)
  const today = new Date()
  const current = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.ceil((due.getTime() - current.getTime()) / 86400000)
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (!data || typeof data !== 'object') return {}
  const record = data as Record<string, unknown>
  if (record.errors && typeof record.errors === 'object') return record.errors as Record<string, string>
  return Object.fromEntries(Object.entries(record).filter(([, value]) => typeof value === 'string')) as Record<string, string>
}
