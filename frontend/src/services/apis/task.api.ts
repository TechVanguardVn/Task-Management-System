import axiosInstance from '@/services/axios/axiosInstance'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { Task, GetTasksQuery, ReorderItem } from '@/pages/Tasks/types/task.types'

export const getTasksAPI = async (params: GetTasksQuery) => {
  const res = await axiosInstance.get<PaginatedResponse<Task>>('/tasks', { params })
  return res.data
}

export const getTaskByIdAPI = async (id: string) => {
  const res = await axiosInstance.get<ApiResponse<Task>>(`/tasks/${id}`)
  return res.data
}

export const createTaskAPI = async (body: Partial<Task>) => {
  const res = await axiosInstance.post<ApiResponse<Task>>('/tasks', body)
  return res.data
}

export const updateTaskAPI = async (id: string, body: Partial<Task>) => {
  const res = await axiosInstance.patch<ApiResponse<Task>>(`/tasks/${id}`, body)
  return res.data
}

export const deleteTaskAPI = async (id: string) => {
  const res = await axiosInstance.delete<ApiResponse<null>>(`/tasks/${id}`)
  return res.data
}

export const updateTaskStatusAPI = async (id: string, status: Task['status']) => {
  const res = await axiosInstance.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status })
  return res.data
}

export const reorderTasksAPI = async (taskOrders: ReorderItem[]) => {
  const res = await axiosInstance.post<ApiResponse<null>>('/tasks/reorder', { taskOrders })
  return res.data
}
