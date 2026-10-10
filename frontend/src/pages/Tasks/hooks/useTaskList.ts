import { useTaskFilter } from './useTaskFilter'
import { useGetTasksQuery } from '@/services/queries/task.query'
import { useAppSelector } from '@/store/hooks'
import type { TaskViewMode } from '../TaskList/components/Header/TaskListHeader'

export const useTaskList = (workspaceId: string, viewMode: TaskViewMode) => {
  const { rawSearch, queryParams, setSearch, setFilter, resetFilters } = useTaskFilter(workspaceId)
  const user = useAppSelector(state => state.auth.user)

  const finalQueryParams = { ...queryParams }
  if (viewMode === 'my_tasks' && user) {
    finalQueryParams.assigneeId = (user as any).id || (user as any)._id
  }

  const { data, isLoading, isError, error } = useGetTasksQuery(finalQueryParams)

  return {
    tasks: data?.data?.items || [],
    pagination: {
      total: data?.data?.total || 0,
      page: data?.data?.page || 1,
      limit: data?.data?.limit || 10,
      totalPages: data?.data?.totalPages || 1,
    },
    isLoading,
    isError,
    error,

    rawSearch,
    queryParams,
    setSearch,
    setFilter,
    resetFilters
  }
}
