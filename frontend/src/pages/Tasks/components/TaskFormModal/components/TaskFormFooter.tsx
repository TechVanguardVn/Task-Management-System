import { Check } from 'lucide-react'

interface TaskFormFooterProps {
  onCancel: () => void
  isSubmitting: boolean
  isEditMode: boolean
}

export const TaskFormFooter = ({ onCancel, isSubmitting, isEditMode }: TaskFormFooterProps) => {
  return (
    <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/40">
      <button 
        type="button" 
        onClick={onCancel}
        disabled={isSubmitting}
        className="bg-rose-50/40 text-rose-500 border border-rose-100 hover:bg-rose-50 active:bg-rose-100/80 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-rose-300/50 disabled:opacity-50"
      >
        Cancel
      </button>

      <button 
        type="submit" 
        disabled={isSubmitting}
        className="relative inline-flex items-center gap-2 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-[0_4px_14px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] rounded-xl px-6 py-2.5 font-bold text-sm hover:brightness-110 active:scale-95 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 disabled:opacity-50"
      >
        <span className="absolute inset-x-0 top-0 h-[1px] bg-white/40 rounded-t-xl"></span>
        <Check size={16} strokeWidth={2.5} />
        {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Task' : 'Save Task')}
      </button>
    </div>
  )
}
