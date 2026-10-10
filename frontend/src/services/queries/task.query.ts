import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createTaskAPI,
  deleteTaskAPI,
  getTaskByIdAPI,
  getTasksAPI,
  reorderTasksAPI,
  updateTaskAPI,
  updateTaskStatusAPI,
} from '@/services/apis/task.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { GetTasksQuery, ReorderItem, Task } from '@/pages/Tasks/types/task.types'

export const useGetTasksQuery = (params: GetTasksQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.TASKS_LIST(params),
    queryFn: () => getTasksAPI(params),
    staleTime: 30 * 1000,
  })

export const useGetTaskByIdQuery = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.TASK_DETAIL(id),
    queryFn: () => getTaskByIdAPI(id),
    enabled: !!id,
  })

export const useCreateTaskMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: Partial<Task>) => createTaskAPI(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['TASKS_LIST'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_STATS'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_UPCOMING'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_WORKLOAD'] })
    },
  })
}

export const useUpdateTaskMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Task> }) => updateTaskAPI(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['TASKS_LIST'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TASK_DETAIL(id) })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_STATS'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_UPCOMING'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_WORKLOAD'] })
    },
  })
}

export const useDeleteTaskMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteTaskAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['TASKS_LIST'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_STATS'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_UPCOMING'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_WORKLOAD'] })
    },
  })
}

export const useUpdateTaskStatusMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Task['status'] }) =>
      updateTaskStatusAPI(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['TASKS_LIST'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_STATS'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_UPCOMING'] })
      queryClient.invalidateQueries({ queryKey: ['DASHBOARD_WORKLOAD'] })
    },
  })
}

export const useReorderTasksMutation = () =>
  useMutation({
    mutationFn: (taskOrders: ReorderItem[]) => reorderTasksAPI(taskOrders),
  })
