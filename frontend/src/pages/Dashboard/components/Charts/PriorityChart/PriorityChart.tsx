import type { DashboardStats } from '../../../types/dashboard.types'
import { PriorityBarItem } from './components/PriorityBarItem'
import { getPriorityPeak } from '../../../utils/dashboard.utils'

interface Props {
  stats: DashboardStats
}

export const PriorityChart = ({ stats }: Props) => {
  const { total, priorityCounts } = stats
  
  const lowPct = total === 0 ? 0 : (priorityCounts.LOW / total) * 100
  const medPct = total === 0 ? 0 : (priorityCounts.MEDIUM / total) * 100
  const highPct = total === 0 ? 0 : (priorityCounts.HIGH / total) * 100
  const urgentPct = total === 0 ? 0 : (priorityCounts.URGENT / total) * 100

  const { peakLabel, peakPct } = getPriorityPeak(priorityCounts, total)

  return (
    <div className="bg-white/75 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_20px_48px_rgba(15,23,42,0.05),0_1px_0_0_rgba(255,255,255,0.9)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[18px] text-slate-900 font-semibold tracking-tight">Tasks by Priority</h2>
            <p className="text-sm text-slate-500 mt-0.5">Resource allocation and severity breakdown</p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 text-slate-900 text-[11px] font-bold">
            {total} Mapped
          </span>
        </div>
        <div className="h-px w-full bg-slate-200 my-6"></div>
      </div>

      <div className="flex flex-col gap-6 py-2">
        <PriorityBarItem 
          label="Low Priority" 
          count={priorityCounts.LOW} 
          percentage={lowPct} 
          colorClass="bg-emerald-500" 
          gradientClass="bg-gradient-to-r from-emerald-400 to-emerald-500" 
        />
        <PriorityBarItem 
          label="Medium Priority" 
          count={priorityCounts.MEDIUM} 
          percentage={medPct} 
          colorClass="bg-amber-500" 
          gradientClass="bg-gradient-to-r from-amber-400 to-amber-500" 
        />
        <PriorityBarItem 
          label="High Priority" 
          count={priorityCounts.HIGH} 
          percentage={highPct} 
          colorClass="bg-rose-500" 
          gradientClass="bg-gradient-to-r from-rose-400 to-rose-500" 
        />
        <PriorityBarItem 
          label="Urgent Priority" 
          count={priorityCounts.URGENT} 
          percentage={urgentPct} 
          colorClass="bg-fuchsia-600" 
          gradientClass="bg-gradient-to-r from-fuchsia-500 to-fuchsia-600" 
        />
      </div>

      <div className="mt-4 p-4 rounded-2xl bg-slate-50 flex items-center justify-between">
        <span className="text-sm text-slate-500">Peak Concentration</span>
        <span className="text-sm text-indigo-600 font-bold">{peakLabel} ({Math.round(peakPct)}%)</span>
      </div>
    </div>
  )
}
