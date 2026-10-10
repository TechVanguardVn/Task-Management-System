import { X, Building2 } from 'lucide-react'

interface WorkspaceFormHeaderProps {
  onClose: () => void
}

export const WorkspaceFormHeader = ({ onClose }: WorkspaceFormHeaderProps) => {
  return (
    <div className="relative border-b border-slate-100/80 bg-white/40 px-6 sm:px-8 py-5 flex items-center justify-between">
      <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
        <span className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
          <Building2 size={20} />
        </span>
        Create New Workspace
      </h2>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100/50 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
      >
        <X size={18} />
      </button>
    </div>
  )
}
