export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do', color: 'slate' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: 'amber' },
  { value: 'DONE', label: 'Done', color: 'emerald' },
] as const

export const TASK_PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low Priority', color: 'slate' },
  { value: 'MEDIUM', label: 'Medium Priority', color: 'indigo' },
  { value: 'HIGH', label: 'High Priority', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'rose' },
] as const
