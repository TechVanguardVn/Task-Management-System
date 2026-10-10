import axiosInstance from '@/services/axios/axiosInstance'
import type { ApiResponse } from '@/types/api.types'
import type { DashboardStats, UpcomingTask, WorkloadData } from '@/pages/Dashboard/types/dashboard.types'

export const getDashboardStatsAPI = async (workspaceId: string) => {
  const res = await axiosInstance.get<ApiResponse<DashboardStats>>(`/dashboard/stats`, {
    params: { workspaceId }
  })
  return res.data.data
}

export const getUpcomingTasksAPI = async (workspaceId: string) => {
  const res = await axiosInstance.get<ApiResponse<UpcomingTask[]>>(`/dashboard/upcoming`, {
    params: { workspaceId }
  })
  return res.data.data
}

export const getWorkloadAPI = async (workspaceId: string) => {
  const res = await axiosInstance.get<ApiResponse<WorkloadData[]>>(`/dashboard/workload`, {
    params: { workspaceId }
  })
  return res.data.data
}
