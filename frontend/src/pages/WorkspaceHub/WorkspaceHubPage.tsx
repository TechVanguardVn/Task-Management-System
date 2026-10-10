import { Skeleton } from 'antd'
import { useWorkspaceHub } from './hooks/useWorkspaceHub'
import { WorkspaceEmptyState } from './components/WorkspaceEmptyState/WorkspaceEmptyState'
import { WorkspaceList } from './components/WorkspaceList/WorkspaceList'
import { CreateWorkspaceModal } from './components/CreateWorkspaceModal/CreateWorkspaceModal'

export default function WorkspaceHubPage() {
  const {
    hasWorkspaces,
    isLoading,
    workspaces,
    searchQuery,
    setSearchQuery,
    inviteStatus,
    handleCheckInviteStatus,
    handleCreateWorkspace,
    handleEnterWorkspace,
    isCreateModalOpen,
    handleCloseCreateModal,
    activeOrgCount
  } = useWorkspaceHub()



  return (
    <div className="w-full relative pb-10 flex flex-col flex-grow">

      <div className="absolute -top-[25%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-br from-indigo-200/40 via-blue-100/50 to-transparent blur-3xl opacity-70 pointer-events-none -z-10 transform-gpu"></div>
      <div className="absolute top-[10%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-bl from-violet-200/40 via-indigo-50/60 to-transparent blur-3xl opacity-60 pointer-events-none -z-10 transform-gpu"></div>
      <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-t from-sky-200/30 via-slate-100/40 to-transparent blur-3xl opacity-50 pointer-events-none -z-10 transform-gpu"></div>

      <div className="relative z-10 w-full flex-grow flex flex-col">
        {isLoading ? (
          <div className="w-full max-w-7xl mx-auto flex flex-col gap-6">
            <Skeleton.Button active block className="!h-16 !rounded-2xl !w-1/3 bg-white/40 mb-4" />
            <Skeleton.Button active block className="!h-20 !rounded-2xl bg-white/40" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Skeleton.Button active block className="!h-64 !rounded-2xl bg-white/40" />
              <Skeleton.Button active block className="!h-64 !rounded-2xl bg-white/40" />
              <Skeleton.Button active block className="!h-64 !rounded-2xl bg-white/40" />
            </div>
          </div>
        ) : hasWorkspaces ? (
          <WorkspaceList
            workspaces={workspaces}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreateClick={handleCreateWorkspace}
            onEnterWorkspace={handleEnterWorkspace}
            activeOrgCount={activeOrgCount}
          />
        ) : (
          <div className="flex flex-col items-center justify-center flex-grow">
            <WorkspaceEmptyState
              inviteStatus={inviteStatus}
              onCheckInvite={handleCheckInviteStatus}
              onCreateWorkspace={handleCreateWorkspace}
            />
          </div>
        )}
      </div>

      <CreateWorkspaceModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

    </div>
  )
}
