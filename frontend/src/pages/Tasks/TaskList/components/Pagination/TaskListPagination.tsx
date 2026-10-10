import { ChevronLeft, ChevronRight } from 'lucide-react'

interface TaskListPaginationProps {
  pagination: { total: number; page: number; limit: number; totalPages: number }
  onPageChange: (page: number) => void
}

export const TaskListPagination = ({ pagination, onPageChange }: TaskListPaginationProps) => {
  const { total, page, limit, totalPages } = pagination
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)

  return (
    <div className="bg-white/65 backdrop-blur-2xl rounded-2xl p-4 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.04),inset_0_1px_0_0_rgba(255,255,255,0.85)] flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 font-medium">
          Showing <span className="text-slate-900 font-semibold">{start}</span> to <span className="text-slate-900 font-semibold">{end}</span> of <span className="text-slate-900 font-semibold">{total}</span> tasks
        </span>
      </div>
      
      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <button 
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3.5 py-1.5 rounded-lg bg-white/50 text-slate-900 disabled:text-slate-300 text-sm font-semibold hover:bg-white disabled:hover:bg-white/50 flex items-center gap-1 transition-all disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
          <span>Prev</span>
        </button>
        
        <button className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-[0_4px_14px_-2px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]">
          {page}
        </button>
        
        <button 
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3.5 py-1.5 rounded-lg bg-white/80 text-slate-900 hover:bg-white disabled:text-slate-300 disabled:hover:bg-white/80 text-sm font-medium shadow-sm flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Next</span>
          <ChevronRight size={16} />
        </button>
      </nav>
    </div>
  )
}
