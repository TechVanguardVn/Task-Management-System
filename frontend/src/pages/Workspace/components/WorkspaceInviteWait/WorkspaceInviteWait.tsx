import { ArrowLeft, MailOpen, RefreshCw, CheckCircle2 } from 'lucide-react'
import { useCheckInvites } from '../../hooks/useCheckInvites'
import { WORKSPACE_TEXTS } from '../../constants/workspace.constants'
import { useAppSelector } from '@/store/hooks'

interface Props {
  onBack: () => void
}

export const WorkspaceInviteWait = ({ onBack }: Props) => {
  const { isChecking, hasChecked, checkInvites } = useCheckInvites()
  const user = useAppSelector(state => state.auth.user)

  return (
    <div className="max-w-xl mx-auto mt-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span>{WORKSPACE_TEXTS.backToOptions}</span>
      </button>

      <div className="bg-white/60 backdrop-blur-md rounded-2xl p-8 shadow-sm border border-white/80 text-center">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-violet-200/50 animate-ping opacity-40"></div>
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg">
            <MailOpen size={32} />
          </div>
        </div>

        <h3 className="text-2xl font-semibold text-slate-900 mt-6">
          {WORKSPACE_TEXTS.invite.awaitingTitle}
        </h3>
        <p className="text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
          {WORKSPACE_TEXTS.invite.awaitingDesc}
        </p>

        <div className="mt-6 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-white/80 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"></span>
          <span className="text-xs text-slate-500">{WORKSPACE_TEXTS.invite.loggedInAs}</span>
          <span className="text-xs font-semibold text-slate-900">{user?.email || 'User'}</span>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={checkInvites}
            disabled={isChecking}
            className="w-full sm:w-auto py-3 px-6 rounded-xl text-sm text-white font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 shadow-md hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
          >
            <RefreshCw size={18} className={isChecking ? 'animate-spin' : ''} />
            <span>{isChecking ? WORKSPACE_TEXTS.invite.queryingBtn : WORKSPACE_TEXTS.invite.checkInvitesBtn}</span>
          </button>
        </div>

        {hasChecked && !isChecking && (
          <div className="mt-5 p-3 rounded-xl bg-indigo-50/60 text-indigo-600 text-xs font-medium flex items-center justify-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>{WORKSPACE_TEXTS.invite.noInvitesMsg}</span>
          </div>
        )}
      </div>
    </div>
  )
}
