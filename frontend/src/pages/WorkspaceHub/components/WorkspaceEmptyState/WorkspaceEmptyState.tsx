import { Building2, Mail, ArrowRight, Sparkles, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react'
import { WORKSPACE_HUB_TEXTS } from '../../constants/workspaceHub.constants'
import { WorkspaceActionCard } from './WorkspaceActionCard'

interface Props {
  inviteStatus: 'idle' | 'checking' | 'done'
  onCheckInvite: () => void
  onCreateWorkspace: () => void
}

export const WorkspaceEmptyState = ({ inviteStatus, onCheckInvite, onCreateWorkspace }: Props) => {
  return (
    <div className="w-full max-w-4xl mx-auto bg-white/40 backdrop-blur-2xl rounded-3xl p-8 lg:p-12 shadow-[0_8px_32px_rgba(15,23,42,0.04)] border border-white/60 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[11px] font-bold uppercase tracking-wider mb-4 border border-indigo-100">
          <Sparkles size={14} />
          {WORKSPACE_HUB_TEXTS.emptyState.subtitle}
        </div>
        <h2 className="text-4xl text-slate-900 font-bold mb-3 tracking-tight">
          {WORKSPACE_HUB_TEXTS.emptyState.title}
        </h2>
        <p className="text-base text-slate-500">
          {WORKSPACE_HUB_TEXTS.emptyState.description}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <WorkspaceActionCard 
          title={WORKSPACE_HUB_TEXTS.emptyState.cardCreateTitle}
          description={WORKSPACE_HUB_TEXTS.emptyState.cardCreateDesc}
          icon={<Building2 size={28} />}
          gradientClass="from-indigo-600 via-indigo-500 to-violet-600"
          iconShadowClass="shadow-[0_8px_20px_rgba(79,70,229,0.3)]"
          cardShadowHoverClass="hover:shadow-[0_16px_36px_-6px_rgba(79,70,229,0.12)] border border-white/50"
          actionContent={
            <button 
              onClick={onCreateWorkspace}
              className="w-full bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white font-semibold py-3 px-6 rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35)] hover:shadow-[0_12px_24px_-4px_rgba(79,70,229,0.45)] hover:brightness-105 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>{WORKSPACE_HUB_TEXTS.emptyState.btnGetStarted}</span>
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          }
        />

        <WorkspaceActionCard 
          title={WORKSPACE_HUB_TEXTS.emptyState.cardWaitTitle}
          description={WORKSPACE_HUB_TEXTS.emptyState.cardWaitDesc}
          icon={<Mail size={28} />}
          gradientClass="from-violet-600 via-fuchsia-500 to-pink-500"
          iconShadowClass="shadow-[0_8px_20px_rgba(124,58,237,0.3)]"
          cardShadowHoverClass="hover:shadow-[0_16px_36px_-6px_rgba(124,58,237,0.12)] border border-white/50"
          actionContent={
            <div className="flex items-center justify-between gap-4 bg-white/50 rounded-xl p-2.5 border border-white/40">
              <div className="flex items-center gap-2.5 pl-2">
                {inviteStatus === 'checking' ? (
                  <RefreshCw size={14} className="text-violet-600 animate-spin" />
                ) : (
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-violet-500"></span>
                  </span>
                )}
                <span className="text-xs font-semibold text-slate-700">
                  {inviteStatus === 'checking' 
                    ? WORKSPACE_HUB_TEXTS.emptyState.statusChecking 
                    : inviteStatus === 'done' 
                      ? WORKSPACE_HUB_TEXTS.emptyState.statusNoInvites 
                      : 'Pending Check'}
                </span>
              </div>
              <button 
                onClick={onCheckInvite}
                disabled={inviteStatus === 'checking'}
                className="px-3.5 py-1.5 rounded-lg bg-white text-violet-600 hover:text-violet-700 text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50 border border-slate-100"
              >
                <span>{WORKSPACE_HUB_TEXTS.emptyState.btnCheckStatus}</span>
              </button>
            </div>
          }
        />
      </div>

      <div className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 border-t border-slate-200/50">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-slate-400" />
          <span className="text-xs">SSO and SCIM provisioning available for Okta, Azure AD & Google</span>
        </div>
        <a className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1" href="#">
          <span>Read domain migration docs</span>
          <ExternalLink size={14} />
        </a>
      </div>

    </div>
  )
}
