import { X } from 'lucide-react'

interface TaskFormHeaderProps {
  isEditMode: boolean
  onClose: () => void
}

export const TaskFormHeader = ({ isEditMode, onClose }: TaskFormHeaderProps) => {
  return (
    <div className="flex items-center justify-between px-6 py-5 border-b border-white/60 bg-white/30">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">
            {isEditMode ? 'Edit Task' : 'Create New Task'}
          </h2>
        </div>
      </div>

      <button 
        type="button" 
        onClick={onClose}
        className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100/70 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        aria-label="Close modal"
      >
        <X size={20} strokeWidth={2.2} />
      </button>
    </div>
  )
}
