import { PRIORITY_COLORS } from '../constants/dispatch.constants'
import type { TaskPriority } from '@/pages/Tasks/types/task.types'

export const getPriorityColor = (priority: string): string => {
  return PRIORITY_COLORS[priority as TaskPriority] || PRIORITY_COLORS.LOW
}

export const getAvatarUrl = (name: string, avatarUrl?: string): string => {
  if (avatarUrl) return avatarUrl
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`
}

export const formatShortId = (id: string): string => {
  return `#${id.slice(0, 5).toUpperCase()}`
}
