export const MENU_KEYS = {
  DASHBOARD: '/dashboard',
  TASK_LIST: '/task-list',
  KANBAN_BOARD: '/kanban-board',
  WORKSPACE: '/workspaces',
} as const

export const MENU_LABELS = {
  [MENU_KEYS.DASHBOARD]: 'Dashboard',
  [MENU_KEYS.TASK_LIST]: 'Task List',
  [MENU_KEYS.KANBAN_BOARD]: 'Kanban Board',
  [MENU_KEYS.WORKSPACE]: 'Workspace',
} as const
