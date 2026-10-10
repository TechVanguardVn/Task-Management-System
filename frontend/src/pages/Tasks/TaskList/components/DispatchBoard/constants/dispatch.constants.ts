import type { TaskPriority } from '@/pages/Tasks/types/task.types'

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  URGENT: 'bg-rose-100 text-rose-700 border-rose-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW: 'bg-slate-100 text-slate-700 border-slate-200'
}

export const DND_IDENTIFIERS = {
  UNASSIGNED: 'unassigned'
} as const

export const ANIMATION_DURATION = 300
