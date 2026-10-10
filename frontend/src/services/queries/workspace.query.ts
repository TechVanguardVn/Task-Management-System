import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createWorkspaceAPI,
  deleteWorkspaceAPI,
  getWorkspaceByIdAPI,
  getWorkspacesAPI,
  updateWorkspaceAPI,
  getWorkspaceMembersAPI,
  addWorkspaceMemberAPI,
  removeWorkspaceMemberAPI,
  updateWorkspaceMemberRoleAPI,
} from '@/services/apis/workspace.api'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { GetWorkspacesQuery, CreateWorkspaceInput, UpdateWorkspaceInput } from '@/pages/WorkspaceHub/types/workspace.types'

export const useGetWorkspacesQuery = (params: GetWorkspacesQuery) =>
  useQuery({
    queryKey: QUERY_KEYS.WORKSPACES_LIST(params),
    queryFn: () => getWorkspacesAPI(params),
    staleTime: 30 * 1000,
  })

export const useGetWorkspaceByIdQuery = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.WORKSPACE_DETAIL(id),
    queryFn: () => getWorkspaceByIdAPI(id),
    enabled: !!id,
  })

export const useCreateWorkspaceMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateWorkspaceInput) => createWorkspaceAPI(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['WORKSPACES_LIST'] })
    },
  })
}

export const useUpdateWorkspaceMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateWorkspaceInput }) => updateWorkspaceAPI(id, body),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['WORKSPACES_LIST'] })
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE_DETAIL(id) })
    },
  })
}

export const useDeleteWorkspaceMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteWorkspaceAPI(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['WORKSPACES_LIST'] })
    },
  })
}

export const useGetWorkspaceMembersQuery = (workspaceId: string) =>
  useQuery({
    queryKey: ['WORKSPACE_MEMBERS', workspaceId],
    queryFn: () => getWorkspaceMembersAPI(workspaceId),
    enabled: !!workspaceId,
  })

export const useAddWorkspaceMemberMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string, email: string, role: string }) => addWorkspaceMemberAPI(workspaceId, email, role),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['WORKSPACE_MEMBERS', workspaceId] })
    },
  })
}

export const useRemoveWorkspaceMemberMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, memberId }: { workspaceId: string, memberId: string }) => removeWorkspaceMemberAPI(workspaceId, memberId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['WORKSPACE_MEMBERS', workspaceId] })
    },
  })
}

export const useUpdateWorkspaceMemberRoleMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ workspaceId, memberId, role }: { workspaceId: string, memberId: string, role: string }) => updateWorkspaceMemberRoleAPI(workspaceId, memberId, role),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ['WORKSPACE_MEMBERS', workspaceId] })
    },
  })
}
