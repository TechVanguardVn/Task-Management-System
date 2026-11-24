import { useSyncExternalStore } from 'react'
import { useQueries } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.js'
import { getAccessToken } from '../api/tokenStore.js'
import { loadTaskCollection } from '../api/taskCollection.js'
import {
  queryClient,
  cacheVersion,
  readBlocked,
  scopedKey,
  subscribeCache,
} from '../query/client.js'
import { keys } from '../query/keys.js'
import { useApiResource } from './useApiResource.js'
import { combinedTaskPage } from '../components/tasks/combinedTasks.js'

export function useTaskScopeResource(projects, projectId, query) {
  useSyncExternalStore(subscribeCache, cacheVersion, cacheVersion)
  const all = projectId === 'all'
  const results = useQueries({
    queries: projects.map((project) => ({
      queryKey: scopedKey(keys.collection(project.id)),
      queryFn: ({ signal }) => loadTaskCollection(tasksApi, project.id, signal),
      enabled:
        all &&
        Boolean(getAccessToken()) &&
        !readBlocked(keys.collection(project.id)),
    })),
  })
  const single = useApiResource(
    (signal) => {
      const state = queryClient.getQueryState(
        scopedKey(keys.collection(projectId)),
      )
      if (
        state?.data &&
        !state.isInvalidated &&
        Date.now() - state.dataUpdatedAt < 30_000
      )
        return combinedTaskPage(state.data.content, query)
      return tasksApi.list(projectId, query, signal)
    },
    keys.tasks(projectId, query),
    !all,
  )
  if (!all) return single
  const missing = results.some((result) => !result.data)
  const failures = results.flatMap((result, index) =>
    result.isError
      ? [
          {
            project: projects[index],
            error: result.error,
            at: result.errorUpdatedAt,
          },
        ]
      : [],
  )
  const content = results.flatMap((result, index) =>
    (result.data?.content || []).map((task) => ({
      ...task,
      project: projects[index],
    })),
  )
  return {
    status: missing ? (failures.length ? 'error' : 'loading') : 'success',
    data: missing ? null : combinedTaskPage(content, query),
    error: failures[0]?.error,
    backgroundError: !missing ? failures[0]?.error : null,
    isFetching: results.some((result) => result.isFetching),
    failures,
    retry: () =>
      results.forEach((result, index) => {
        if (
          !readBlocked(keys.collection(projects[index].id)) &&
          (!failures.length || result.isError)
        )
          void result.refetch()
      }),
  }
}
