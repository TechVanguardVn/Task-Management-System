import { UserPlus, Trash2 } from 'lucide-react'
import { MEMBERS_TEXTS } from '../../constants/members.constants'

interface Props {
  onInviteClick: () => void
  isOwner?: boolean
  onDeleteWorkspace?: () => void
}

export const MembersHeader = ({ onInviteClick, isOwner, onDeleteWorkspace }: Props) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div className="flex flex-col">
        <h1 className="text-3xl text-slate-900 tracking-tight font-bold">
          {MEMBERS_TEXTS.header.title}
        </h1>
      </div>
      <div className="flex items-center gap-2 self-start md:self-auto">
        {isOwner && (
          <button 
            onClick={onDeleteWorkspace}
            className="h-11 px-5 rounded-xl bg-white/40 border border-rose-200 text-rose-600 font-semibold text-sm flex items-center gap-2 shadow-sm hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 active:scale-95 transition-all"
          >
            <Trash2 size={18} />
            <span>Xoá Workspace</span>
          </button>
        )}
        <button 
          onClick={onInviteClick}
          className="h-11 px-5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white font-semibold text-sm flex items-center gap-2 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 active:scale-95 transition-all"
        >
          <UserPlus size={18} />
          <span>{MEMBERS_TEXTS.header.inviteBtn}</span>
        </button>
      </div>
    </div>
  )
}
