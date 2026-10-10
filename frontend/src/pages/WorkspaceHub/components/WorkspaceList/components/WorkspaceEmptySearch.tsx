import { SearchX } from 'lucide-react'
import { WORKSPACE_HUB_TEXTS } from '../../../constants/workspaceHub.constants'

export const WorkspaceEmptySearch = () => {
  return (
    <div className="py-16 text-center bg-white/40 backdrop-blur-xl rounded-2xl border border-white/60">
      <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400 mb-3">
        <SearchX size={24} />
      </div>
      <p className="text-lg font-semibold text-slate-900">{WORKSPACE_HUB_TEXTS.list.emptySearchTitle}</p>
      <p className="text-sm text-slate-500 mt-1">{WORKSPACE_HUB_TEXTS.list.emptySearchDesc}</p>
    </div>
  )
}
