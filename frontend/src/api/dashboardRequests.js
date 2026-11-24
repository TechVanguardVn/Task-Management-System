export function createDashboardApi(client) {
  return {
    summary: async (signal) => {
      const { data } = await client.get('/api/dashboard/summary', { signal })
      const counts = ['totalTasks', 'todoTasks', 'inProgressTasks', 'doneTasks']
      if (
        !counts.every(
          (key) => Number.isSafeInteger(data?.[key]) && data[key] >= 0,
        ) ||
        data.totalTasks !==
          data.todoTasks + data.inProgressTasks + data.doneTasks ||
        !Number.isFinite(data.completionPercentage) ||
        data.completionPercentage < 0 ||
        data.completionPercentage > 100
      ) {
        throw new Error('Invalid dashboard summary response')
      }
      return data
    },
    upcoming: (page, signal) =>
      getPage('/api/dashboard/upcoming', { page, size: 4 }, signal),
    overdue: (page, signal) =>
      getPage('/api/dashboard/overdue', { page, size: 4 }, signal),
    projects: (signal) =>
      getPage('/api/projects', { page: 0, size: 4 }, signal),
    task: async (taskId, signal) => {
      const { data } = await client.get(
        `/api/tasks/${encodeURIComponent(taskId)}`,
        { signal },
      )
      return data
    },
  }

  async function getPage(path, params, signal) {
    const { data } = await client.get(path, { params, signal })
    if (
      !Array.isArray(data?.content) ||
      !['page', 'size', 'totalElements', 'totalPages'].every(
        (key) => Number.isSafeInteger(data[key]) && data[key] >= 0,
      )
    ) {
      throw new Error('Invalid paginated API response')
    }
    return data
  }
}
