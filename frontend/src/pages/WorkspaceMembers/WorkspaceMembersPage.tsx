import { useParams } from 'react-router-dom'
import { Skeleton } from 'antd'
import { useConfirm } from '@/shared/components/ConfirmModal/hooks/useConfirm'
import { useWorkspaceMembers } from './hooks/useWorkspaceMembers'
import { MembersHeader } from './components/MembersHeader/MembersHeader'
import { MembersFilter } from './components/MembersFilter/MembersFilter'
import { MembersList } from './components/MembersList/MembersList'
import { InviteMemberModal } from './components/InviteMemberModal/InviteMemberModal'
import { ChangeRoleModal } from './components/ChangeRoleModal/ChangeRoleModal'

export default function WorkspaceMembersPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const {
    members,
    isLoading,
    totalCount,
    ownerCount,
    adminCount,
    memberCount,
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
    memberToChangeRole,
    isOwner,
    handleDeleteWorkspace,
    workspaceName,
    currentUserRole
  } = useWorkspaceMembers(workspaceId || '')

  const confirm = useConfirm()

  const confirmDeleteWorkspace = () => {
    confirm({
      title: 'Xóa Workspace này vĩnh viễn?',
      okType: 'danger',
      content: (
        <p className="text-slate-600 text-[15px] leading-relaxed">
          Hành động này không thể hoàn tác. TOÀN BỘ thành viên, dữ liệu và Tasks trong Workspace <strong>{workspaceName}</strong> sẽ bị xóa vĩnh viễn khỏi hệ thống.
        </p>
      ),
      okText: 'Xóa vĩnh viễn',
      cancelText: 'Hủy bỏ',
      onOk: async () => {
        await handleDeleteWorkspace()
      }
    })
  }

  return (
    <div className="w-full flex flex-col">
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute top-24 -right-20 w-80 h-80 bg-violet-200/40 rounded-full blur-[90px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 flex flex-col gap-6 relative z-10 animate-in fade-in duration-500">
          
          <MembersHeader 
            onInviteClick={() => setIsInviteModalOpen(true)} 
            isOwner={isOwner}
            onDeleteWorkspace={confirmDeleteWorkspace}
          />

          <MembersFilter 
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            roleFilter={roleFilter}
            onRoleFilterChange={setRoleFilter}
            counts={{
              all: totalCount,
              owner: ownerCount,
              admin: adminCount,
              member: memberCount,
            }}
          />

          {isLoading ? (
            <div className="flex flex-col gap-2.5 mt-4">
              <Skeleton.Button active block className="!h-24 !rounded-2xl bg-white/40 border border-white/60" />
              <Skeleton.Button active block className="!h-24 !rounded-2xl bg-white/40 border border-white/60" />
              <Skeleton.Button active block className="!h-24 !rounded-2xl bg-white/40 border border-white/60" />
            </div>
          ) : (
            <MembersList 
              members={members}
              onRoleChange={handleRoleChange}
              onRemove={handleRemoveMember}
              onChangeRoleAction={(memberId) => setChangeRoleMemberId(memberId)}
              currentUserRole={currentUserRole}
              workspaceId={workspaceId || ''}
            />
          )}
        </div>
      </div>

      <InviteMemberModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSubmit={handleInvite}
      />
      
      <ChangeRoleModal 
        isOpen={!!changeRoleMemberId}
        onClose={() => setChangeRoleMemberId(null)}
        member={memberToChangeRole}
        onSubmit={handleRoleChange}
      />
    </div>
  )
}
