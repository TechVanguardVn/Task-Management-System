import { Plus } from 'lucide-react'

export const CreateTaskButton = () => {
  return (
    <button className="h-10 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-[14px] flex items-center gap-1.5 shadow-[0_8px_20px_-4px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] hover:scale-[1.01] active:scale-[0.99] transition-all">
      <Plus size={18} strokeWidth={2.5} />
      <span className="hidden sm:inline">Create Task</span>
    </button>
  )
}
