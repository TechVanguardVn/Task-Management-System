import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGetWorkspacesQuery } from '@/services/queries/workspace.query'
import { useDebounce } from '@/hooks/useDebounce'

export const useWorkspaceHub = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)

  const { data: response, isLoading } = useGetWorkspacesQuery({
    search: debouncedSearch,
    page: 1,
    limit: 100,
  })

  const workspaces = response?.data?.items || []
  const hasWorkspaces = workspaces.length > 0

  const [inviteStatus, setInviteStatus] = useState<'idle' | 'checking' | 'done'>('idle')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const navigate = useNavigate()

  const handleCheckInviteStatus = () => {
    setInviteStatus('checking')
    setTimeout(() => {
      setInviteStatus('done')
    }, 1500)
  }

  const handleCreateWorkspace = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleEnterWorkspace = (id: string) => {
    navigate(`/workspaces/${id}/members`)
  }

  return {
    workspaces,
    hasWorkspaces,
    isLoading,
    searchQuery,
    setSearchQuery,
    inviteStatus,
    handleCheckInviteStatus,
    handleCreateWorkspace,
    handleEnterWorkspace,
    isCreateModalOpen,
    handleCloseCreateModal,
    activeOrgCount: workspaces.length
  }
}
