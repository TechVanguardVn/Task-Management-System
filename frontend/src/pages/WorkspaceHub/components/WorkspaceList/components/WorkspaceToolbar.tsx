import { Search, Plus } from 'lucide-react'
import { WORKSPACE_HUB_TEXTS } from '../../../constants/workspaceHub.constants'

interface Props {
  searchQuery: string
  onSearchChange: (value: string) => void
  onCreateClick: () => void
  activeOrgCount: number
}

export const WorkspaceToolbar = ({ searchQuery, onSearchChange, onCreateClick, activeOrgCount }: Props) => {
  return (
    <div className="bg-white/60 backdrop-blur-2xl rounded-2xl p-4 shadow-sm border border-white/50 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">

      <div className="relative w-full sm:w-96 flex items-center">
        <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
          <Search size={20} />
        </div>
        <input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-slate-50/50 focus:bg-white text-slate-900 placeholder:text-slate-400 pl-11 pr-14 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner transition-all border border-slate-200/50"
          placeholder={WORKSPACE_HUB_TEXTS.list.searchPlaceholder}
          type="text"
        />
      </div>

      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 text-slate-500 text-xs font-semibold border border-slate-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {activeOrgCount} Active Orgs
        </span>
        <button
          onClick={onCreateClick}
          className="w-full sm:w-auto bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 text-white text-sm font-semibold px-6 py-2.5 rounded-xl shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus size={20} />
          <span>{WORKSPACE_HUB_TEXTS.list.btnCreate}</span>
        </button>
      </div>
    </div>
  )
}
