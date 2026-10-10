import { useState, useMemo } from 'react'
import type { WorkspaceMember, MemberRole } from '../types/members.types'
import type { InviteMemberFormData } from '../schemas/members.schema'
import { message } from 'antd'
import { 
  useGetWorkspaceMembersQuery,
  useAddWorkspaceMemberMutation,
  useRemoveWorkspaceMemberMutation,
  useUpdateWorkspaceMemberRoleMutation,
  useGetWorkspaceByIdQuery,
  useDeleteWorkspaceMutation
} from '@/services/queries/workspace.query'
import { useNavigate } from 'react-router-dom'

export const useWorkspaceMembers = (workspaceId: string) => {
  const { data, isLoading } = useGetWorkspaceMembersQuery(workspaceId)
  const { data: workspaceData } = useGetWorkspaceByIdQuery(workspaceId)
  const { mutateAsync: deleteWorkspace } = useDeleteWorkspaceMutation()
  const isOwner = workspaceData?.data?.role === 'OWNER'
  const navigate = useNavigate()

  const { mutateAsync: addMember } = useAddWorkspaceMemberMutation()
  const { mutateAsync: removeMember } = useRemoveWorkspaceMemberMutation()
  const { mutateAsync: updateRole } = useUpdateWorkspaceMemberRoleMutation()
  const membersData = data?.data || []
  const members = membersData as WorkspaceMember[]
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [changeRoleMemberId, setChangeRoleMemberId] = useState<string | null>(null)

  const filteredMembers = useMemo(() => {
    return members.filter(member => {
      const matchesSearch = (member.fullName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
                            (member.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      const matchesRole = roleFilter === 'all' || member.role === roleFilter
      
      return matchesSearch && matchesRole
    })
  }, [members, searchQuery, roleFilter])

  const handleRoleChange = async (memberId: string, newRole: MemberRole) => {
    try {
      await updateRole({ workspaceId, memberId, role: newRole })
      message.success('Role updated successfully')
      setChangeRoleMemberId(null)
    } catch (error: any) {
      message.error(error.response?.data?.error || error.message || 'Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember({ workspaceId, memberId })
      message.success('Member removed successfully')
    } catch (error: any) {
      message.error(error.response?.data?.error || error.message || 'Failed to remove member')
    }
  }

  const handleInvite = async (data: InviteMemberFormData) => {
    try {
      await addMember({ workspaceId, email: data.email, role: data.role })
      message.success('Member added successfully')
      setIsInviteModalOpen(false)
    } catch (error: any) {
      message.error(error.response?.data?.error || error.message || 'Failed to add member')
    }
  }

  const handleDeleteWorkspace = async () => {
    try {
      await deleteWorkspace(workspaceId)
      message.success('Workspace deleted successfully')
      navigate('/workspaces')
    } catch (error: any) {
      message.error(error.response?.data?.error || error.message || 'Failed to delete workspace')
    }
  }

  return {
    members: filteredMembers,
    isLoading,
    totalCount: members.length,
    ownerCount: members.filter(m => m.role === 'OWNER').length,
    adminCount: members.filter(m => m.role === 'ADMIN').length,
    memberCount: members.filter(m => m.role === 'MEMBER').length,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    handleRoleChange,
    handleRemoveMember,
    isInviteModalOpen,
    setIsInviteModalOpen,
    handleInvite,
    changeRoleMemberId,
    setChangeRoleMemberId,
    memberToChangeRole: members.find(m => m.id === changeRoleMemberId) || null,
    isOwner,
    handleDeleteWorkspace,
    workspaceName: workspaceData?.data?.name || '',
    currentUserRole: workspaceData?.data?.role
  }
}
