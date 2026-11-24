export function createTasksApi(client) {
  async function page(path, params, signal) {
    const { data } = await client.get(path, { params, signal })
    if (!Array.isArray(data?.content) || !Number.isInteger(data.totalPages))
      throw new Error('Invalid task page')
    return data
  }
  return {
    get: async (id, signal) =>
      (await client.get(`/api/tasks/${encodeURIComponent(id)}`, { signal }))
        .data,
    projects: async (signal) => {
      const first = await page('/api/projects', { page: 0, size: 100 }, signal)
      const projects = new Map(
        first.content.map((project) => [project.id, project]),
      )
      // Project metadata only: sequential bounded pages, never one task request per project.
      for (let index = 1; index < first.totalPages; index++) {
        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
        const next = await page(
          '/api/projects',
          { page: index, size: 100 },
          signal,
        )
        next.content.forEach((project) => projects.set(project.id, project))
      }
      return [...projects.values()]
    },
    list: (projectId, query, signal) =>
      page(
        `/api/projects/${encodeURIComponent(projectId)}/tasks`,
        {
          page: query.page,
          size: query.size,
          sort: query.sort,
          ...(query.search ? { search: query.search } : {}),
          ...(query.status ? { status: query.status } : {}),
          ...(query.priority ? { priority: query.priority } : {}),
        },
        signal,
      ),
    summary: async (projectId, signal) =>
      (
        await client.get('/api/dashboard/summary', {
          params: { projectId },
          signal,
        })
      ).data,
    overdue: (projectId, signal) =>
      page('/api/dashboard/overdue', { projectId, page: 0, size: 1 }, signal),
    create: async (body, signal) =>
      (
        await client.post(
          `/api/projects/${encodeURIComponent(body.projectId)}/tasks`,
          body,
          { signal },
        )
      ).data,
    update: async (id, body, signal) =>
      (
        await client.put(`/api/tasks/${encodeURIComponent(id)}`, body, {
          signal,
        })
      ).data,
    status: async (id, status, signal) =>
      (
        await client.patch(
          `/api/tasks/${encodeURIComponent(id)}/status`,
          { status },
          { signal },
        )
      ).data,
    remove: async (id, signal) => {
      await client.delete(`/api/tasks/${encodeURIComponent(id)}`, { signal })
    },
  }
}
