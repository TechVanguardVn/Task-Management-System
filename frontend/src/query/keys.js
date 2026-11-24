export const keys = {
  collection: (projectId) => ['tasks', 'collection', projectId],
  user: ['auth', 'user'],
  catalog: ['projects', 'catalog'],
  projects: (page, size = 9) => ['projects', 'page', { page, size }],
  task: (id) => ['tasks', 'detail', id],
  tasks: (projectId, query) => ['tasks', 'list', projectId, query],
  board: (projectId, status, search, priority) => [
    'tasks',
    'board',
    projectId,
    { status, search, priority },
  ],
  summary: (projectId = null) => ['dashboard', 'summary', projectId],
  upcoming: (page) => ['dashboard', 'upcoming', { page, size: 4 }],
  overdue: (projectId = null, page = 0, size = 4) => [
    'dashboard',
    'overdue',
    { projectId, page, size },
  ],
}
