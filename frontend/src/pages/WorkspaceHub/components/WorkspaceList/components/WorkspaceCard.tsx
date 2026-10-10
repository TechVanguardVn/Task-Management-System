import { ArrowRight, Users } from 'lucide-react'
import type { Workspace } from '../../../types/workspace.types'
import { getWorkspaceIconColors, getRoleColors } from '../../../utils/workspaceHub.utils'

interface Props {
  workspace: Workspace
  index: number
  onEnter: (id: string) => void
}

export const WorkspaceCard = ({ workspace, index, onEnter }: Props) => {
  return (
    <div 
      onClick={() => onEnter(workspace._id)}
      className="group relative bg-white/60 backdrop-blur-2xl rounded-2xl p-6 shadow-sm hover:shadow-[0_20px_40px_-6px_rgba(79,70,229,0.12)] hover:bg-white/80 hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between border border-white/50"
    >
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-lg font-bold ${getWorkspaceIconColors(index)}`}>
              {workspace.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                {workspace.name}
              </h3>
              <span className="text-xs text-slate-500 font-medium">Workspace</span>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getRoleColors(workspace.role || 'MEMBER')}`}>
            {workspace.role || 'MEMBER'}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-4 line-clamp-2">
          {workspace.description}
        </p>
      </div>

      <div>
        <div className="w-full h-px bg-slate-200/50 my-4"></div>
        <div className="flex items-center justify-between text-slate-500">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Users size={16} className="text-indigo-500" />
            <span>{workspace.memberCount || 1} Members</span>
            <span className="text-slate-300">•</span>
            <span>{workspace.activeTaskCount || 0} Active Tasks</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white flex items-center justify-center transition-all text-slate-400">
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
}
