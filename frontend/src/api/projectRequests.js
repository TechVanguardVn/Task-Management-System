export function createProjectsApi(client) {
  return {
    list: async (page, signal) => {
      const { data } = await client.get('/api/projects', {
        params: { page, size: 9 },
        signal,
      })
      if (!Array.isArray(data?.content) || !Number.isInteger(data.totalPages))
        throw new Error('Invalid project page')
      return data
    },
    get: async (id, signal) =>
      (await client.get(`/api/projects/${encodeURIComponent(id)}`, { signal }))
        .data,
    create: async (body, signal) =>
      (await client.post('/api/projects', body, { signal })).data,
    update: async (id, body, signal) =>
      (
        await client.put(`/api/projects/${encodeURIComponent(id)}`, body, {
          signal,
        })
      ).data,
    remove: async (id, signal) => {
      await client.delete(`/api/projects/${encodeURIComponent(id)}`, { signal })
    },
    archive: async (id, signal) =>
      (
        await client.patch(
          `/api/projects/${encodeURIComponent(id)}/archive`,
          undefined,
          { signal },
        )
      ).data,
    tasks: async (id, page, signal) =>
      (
        await client.get(`/api/projects/${encodeURIComponent(id)}/tasks`, {
          params: { page, size: 10 },
          signal,
        })
      ).data,
  }
}
