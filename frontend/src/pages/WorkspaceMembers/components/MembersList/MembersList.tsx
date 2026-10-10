import { MemberRow } from './MemberRow'
import type { WorkspaceMember, MemberRole } from '../../types/members.types'
import { MEMBERS_TEXTS } from '../../constants/members.constants'
import { ArrowDown } from 'lucide-react'

interface Props {
  members: WorkspaceMember[]
  onRoleChange: (memberId: string, role: MemberRole) => void
  onRemove: (memberId: string) => void
  onChangeRoleAction: (memberId: string) => void
  currentUserRole?: string
  workspaceId: string
}

export const MembersList = ({ members, onRoleChange, onRemove, onChangeRoleAction, currentUserRole, workspaceId }: Props) => {
  return (
    <div className="flex flex-col mt-4">
      <div className="hidden md:grid grid-cols-12 gap-4 px-5 mb-2 text-[11px] uppercase tracking-wider text-slate-400 font-semibold select-none">
        <div className="col-span-5 flex items-center gap-1">
          <span>{MEMBERS_TEXTS.table.userInfo}</span>
          <ArrowDown size={14} />
        </div>
        <div className="col-span-3">{MEMBERS_TEXTS.table.role}</div>
        <div className="col-span-2">{MEMBERS_TEXTS.table.joinedDate}</div>
        <div className="col-span-2 text-right">{MEMBERS_TEXTS.table.actions}</div>
      </div>

      <div className="flex flex-col gap-2.5">
        {members.map(member => (
          <MemberRow 
            key={member.id} 
            member={member} 
            onRoleChange={onRoleChange}
            onRemove={onRemove}
            onChangeRoleAction={onChangeRoleAction}
            currentUserRole={currentUserRole}
            workspaceId={workspaceId}
          />
        ))}
        {members.length === 0 && (
          <div className="py-10 text-center text-slate-500 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60 shadow-sm">
            No members found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
