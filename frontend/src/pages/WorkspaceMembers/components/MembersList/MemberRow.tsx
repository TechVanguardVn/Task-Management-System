import { Calendar } from 'lucide-react'
import type { WorkspaceMember, MemberRole } from '../../types/members.types'
import { RoleBadge } from './components/RoleBadge'
import { MemberAvatar } from './components/MemberAvatar'
import { MemberActionMenu } from './components/MemberActionMenu'

interface Props {
  member: WorkspaceMember
  onRoleChange: (memberId: string, role: MemberRole) => void
  onRemove: (memberId: string) => void
  onChangeRoleAction: (memberId: string) => void
  currentUserRole?: string
  workspaceId: string
}

export const MemberRow = ({ member, onRoleChange, onRemove, onChangeRoleAction, currentUserRole, workspaceId }: Props) => {
  return (
    <div className="bg-white/70 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_4px_20px_-4px_rgba(15,23,42,0.04)] hover:bg-white/90 hover:scale-[1.008] hover:shadow-[0_12px_28px_-6px_rgba(79,70,229,0.09)] transition-all duration-200 flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 items-start md:items-center relative border border-white/60">
      
      <div className="col-span-5 flex items-center gap-3.5 min-w-0 w-full">
        <MemberAvatar member={member} />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg text-slate-900 font-semibold truncate">{member.fullName}</span>
            {member.isCurrentUser && (
              <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-600 text-[10px] font-bold tracking-wide uppercase">You</span>
            )}
          </div>
          <span className="text-sm text-slate-500 truncate">{member.email}</span>
        </div>
      </div>

      <div className="col-span-3 flex items-center">
        <RoleBadge role={member.role} memberId={member.id} onChange={onRoleChange} />
      </div>

      <div className="col-span-2 flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Calendar size={16} />
        <span>{member.joinedAt}</span>
      </div>

      <div className="col-span-2 flex items-center justify-end w-full">
        <MemberActionMenu 
          memberId={member.id} 
          onRemove={onRemove} 
          onChangeRole={onChangeRoleAction} 
          currentUserRole={currentUserRole}
          workspaceId={workspaceId}
        />
      </div>

    </div>
  )
}
