import { MoreHorizontal } from 'lucide-react'
import type { DashboardStats } from '../../../types/dashboard.types'
import { calculateChartPercentages } from '../../../utils/dashboard.utils'
import { DASHBOARD_CONSTANTS } from '../../../constants/dashboard.constants'

interface Props {
  stats: DashboardStats
}

export const StatusChart = ({ stats }: Props) => {
  const { total, statusCounts } = stats
  
  const [donePct, todoPct, inProgressPct] = calculateChartPercentages(total, [
    statusCounts.DONE,
    statusCounts.TODO,
    statusCounts.IN_PROGRESS
  ])
  
  const doneDash = donePct * DASHBOARD_CONSTANTS.CIRCUMFERENCE
  const todoDash = todoPct * DASHBOARD_CONSTANTS.CIRCUMFERENCE
  const inProgressDash = inProgressPct * DASHBOARD_CONSTANTS.CIRCUMFERENCE

  return (
    <div className="bg-white/75 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_20px_48px_rgba(15,23,42,0.05),0_1px_0_0_rgba(255,255,255,0.9)] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[18px] text-slate-900 font-semibold tracking-tight">Task Status Distribution</h2>
            <p className="text-sm text-slate-500 mt-0.5">Overview across workflow phases</p>
          </div>
          <button className="w-8 h-8 rounded-xl bg-slate-100/60 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-all">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="h-px w-full bg-slate-200 my-6"></div>
      </div>

      <div className="relative py-4 flex flex-col items-center justify-center">
        <div className="relative w-52 h-52 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
            <circle className="text-slate-100" cx="90" cy="90" fill="transparent" r="74" stroke="currentColor" strokeWidth="18"></circle>
            
            {donePct > 0 && (
              <circle className="transition-all duration-1000" cx="90" cy="90" fill="transparent" r="74" stroke="#10b981" strokeDasharray={`${doneDash} ${DASHBOARD_CONSTANTS.CIRCUMFERENCE}`} strokeDashoffset="0" strokeLinecap="round" strokeWidth="18"></circle>
            )}
            
            {todoPct > 0 && (
              <circle className="transition-all duration-1000" cx="90" cy="90" fill="transparent" r="74" stroke="#94a3b8" strokeDasharray={`${todoDash} ${DASHBOARD_CONSTANTS.CIRCUMFERENCE}`} strokeDashoffset={-doneDash} strokeLinecap="round" strokeWidth="18"></circle>
            )}
            
            {inProgressPct > 0 && (
              <circle className="transition-all duration-1000" cx="90" cy="90" fill="transparent" r="74" stroke="#4f46e5" strokeDasharray={`${inProgressDash} ${DASHBOARD_CONSTANTS.CIRCUMFERENCE}`} strokeDashoffset={-(doneDash + todoDash)} strokeLinecap="round" strokeWidth="18"></circle>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-4xl font-bold text-slate-900 tracking-tight leading-none">{total}</span>
            <span className="text-[11px] text-slate-500 uppercase tracking-wider mt-1 font-bold">Total Tasks</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 bg-white/60 rounded-xl p-2">
          <span className="w-3 h-3 rounded-full bg-slate-400 shrink-0"></span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-slate-500 font-bold uppercase truncate">TODO</span>
            <span className="text-sm text-slate-900 font-bold">{statusCounts.TODO} <span className="font-normal text-slate-500">({Math.round(todoPct * 100)}%)</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/60 rounded-xl p-2">
          <span className="w-3 h-3 rounded-full bg-indigo-600 shrink-0"></span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-slate-500 font-bold uppercase truncate">IN PROGRESS</span>
            <span className="text-sm text-slate-900 font-bold">{statusCounts.IN_PROGRESS} <span className="font-normal text-slate-500">({Math.round(inProgressPct * 100)}%)</span></span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/60 rounded-xl p-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0"></span>
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] text-slate-500 font-bold uppercase truncate">DONE</span>
            <span className="text-sm text-slate-900 font-bold">{statusCounts.DONE} <span className="font-normal text-slate-500">({Math.round(donePct * 100)}%)</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
