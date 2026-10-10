import { Clock } from 'lucide-react'
import type { DashboardStats } from '../../../types/dashboard.types'

interface Props {
  total: DashboardStats['total']
  activeCount: number
}

export const ActiveTasksCard = ({ total, activeCount }: Props) => {
  const percentage = total === 0 ? 0 : (activeCount / total) * 100

  return (
    <div className="group relative bg-white/75 hover:bg-white/90 backdrop-blur-2xl rounded-2xl p-6 shadow-[0_12px_32px_-4px_rgba(15,23,42,0.05),0_1px_0_0_rgba(255,255,255,0.9)] transition-all hover:scale-[1.01] flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
          <Clock size={24} />
        </div>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold tracking-tight">
          Current
        </span>
      </div>
      <div className="mt-6 flex flex-col">
        <span className="text-3xl font-bold text-slate-900 tracking-tight">{activeCount}</span>
        <span className="text-sm text-slate-500 font-medium mt-1">Active Tasks</span>
      </div>
      <div className="mt-4 w-full bg-slate-100 rounded-full h-1 overflow-hidden">
        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  )
}
