import { useSyncExternalStore } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { tasksApi } from '../api/tasks.js'
import { getAccessToken } from '../api/tokenStore.js'
import { columnQuery, mergeTasks } from '../components/kanban/kanbanModel.js'
import { keys } from '../query/keys.js'
import {
  cacheVersion,
  readBlocked,
  scopedKey,
  subscribeCache,
} from '../query/client.js'
import { resourceState } from '../query/resourceState.js'

export function useKanbanColumn(projectId, status, search, priority) {
  useSyncExternalStore(subscribeCache, cacheVersion, cacheVersion)
  const key = keys.board(projectId, status, search, priority)
  const blocked = readBlocked(key)
  const query = useInfiniteQuery({
    queryKey: scopedKey(key),
    initialPageParam: 0,
    queryFn: ({ signal, pageParam }) =>
      tasksApi.list(
        projectId,
        columnQuery(status, search, priority, pageParam),
        signal,
      ),
    getNextPageParam: (last, pages) =>
      pages.length < last.totalPages ? pages.length : undefined,
    enabled: Boolean(getAccessToken()) && !blocked,
  })
  const pages = query.data?.pages || []
  return {
    ...resourceState(query),
    tasks: mergeTasks(
      [],
      pages.flatMap((page) => page.content),
    ),
    total: pages[0]?.totalElements ?? null,
    totalPages: pages[0]?.totalPages ?? 0,
    page: pages.length - 1,
    loadingMore: query.isFetchingNextPage,
    moreError: query.isFetchNextPageError ? query.error : null,
    loadMore: () =>
      !blocked &&
      !query.isFetching &&
      query.hasNextPage &&
      query.fetchNextPage(),
    retry: () => !blocked && query.refetch(),
  }
}
