export const QUERY_KEYS = {
  AUTH_ME: ['AUTH_ME'] as const,
  TASKS_LIST: (params?: object) => ['TASKS_LIST', params] as const,
  TASK_DETAIL: (id: string) => ['TASK_DETAIL', id] as const,
  DASHBOARD_STATS: (workspaceId: string) => ['DASHBOARD_STATS', workspaceId] as const,
  DASHBOARD_UPCOMING: (workspaceId: string) => ['DASHBOARD_UPCOMING', workspaceId] as const,
  DASHBOARD_WORKLOAD: (workspaceId: string) => ['DASHBOARD_WORKLOAD', workspaceId] as const,
  WORKSPACES_LIST: (params?: object) => ['WORKSPACES_LIST', params] as const,
  WORKSPACE_DETAIL: (id: string) => ['WORKSPACE_DETAIL', id] as const,
} as const
