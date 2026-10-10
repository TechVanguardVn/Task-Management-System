import axiosInstance from '@/services/axios/axiosInstance'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { 
  Workspace, 
  GetWorkspacesQuery, 
  CreateWorkspaceInput, 
  UpdateWorkspaceInput 
} from '@/pages/WorkspaceHub/types/workspace.types'

export const getWorkspacesAPI = async (params: GetWorkspacesQuery) => {
  const res = await axiosInstance.get<PaginatedResponse<Workspace>>('/workspaces', { params })
  return res.data
}

export const getWorkspaceByIdAPI = async (id: string) => {
  const res = await axiosInstance.get<ApiResponse<Workspace>>(`/workspaces/${id}`)
  return res.data
}

export const createWorkspaceAPI = async (body: CreateWorkspaceInput) => {
  const res = await axiosInstance.post<ApiResponse<Workspace>>('/workspaces', body)
  return res.data
}

export const updateWorkspaceAPI = async (id: string, body: UpdateWorkspaceInput) => {
  const res = await axiosInstance.patch<ApiResponse<Workspace>>(`/workspaces/${id}`, body)
  return res.data
}

export const deleteWorkspaceAPI = async (id: string) => {
  const res = await axiosInstance.delete<ApiResponse<null>>(`/workspaces/${id}`)
  return res.data
}

export const getWorkspaceMembersAPI = async (id: string) => {
  const res = await axiosInstance.get<ApiResponse<any[]>>(`/workspaces/${id}/members`)
  return res.data
}

export const addWorkspaceMemberAPI = async (id: string, email: string, role: string) => {
  const res = await axiosInstance.post<ApiResponse<any>>(`/workspaces/${id}/members`, { email, role })
  return res.data
}

export const removeWorkspaceMemberAPI = async (workspaceId: string, memberId: string) => {
  const res = await axiosInstance.delete<ApiResponse<null>>(`/workspaces/${workspaceId}/members/${memberId}`)
  return res.data
}

export const updateWorkspaceMemberRoleAPI = async (workspaceId: string, memberId: string, role: string) => {
  const res = await axiosInstance.patch<ApiResponse<any>>(`/workspaces/${workspaceId}/members/${memberId}/role`, { role })
  return res.data
}
