import { Avatar } from 'antd'
import type { WorkloadData } from '../../../types/dashboard.types'
import { DASHBOARD_CONSTANTS } from '../../../constants/dashboard.constants'

interface Props {
  item: WorkloadData
}

export const WorkloadItem = ({ item }: Props) => {
  const pct = Math.round((item.activeTasks / DASHBOARD_CONSTANTS.MAX_ACTIVE_TASKS) * 100)
  const isHigh = pct >= 80

  return (
    <div className="p-4 rounded-2xl bg-white/60 backdrop-blur-xl shadow-sm border border-transparent hover:border-slate-100 flex flex-col gap-2 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar src={item.assignee.avatar} alt={item.assignee.fullName} size={40} className="shadow-sm rounded-xl shrink-0">
            {item.assignee.fullName.charAt(0)}
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm text-slate-900 font-bold">{item.assignee.fullName}</span>
            <span className="text-xs text-slate-500">{item.assignee.role || 'Member'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {item.assignee.role && (
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
              {item.assignee.role}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold">
            {item.activeTasks} Tasks
          </span>
        </div>
      </div>
      
      <div className="flex flex-col gap-1 mt-1">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Capacity utilization</span>
          <span className="font-medium text-slate-900">{pct}% {isHigh ? '(Near Max)' : '(Optimal)'}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 shadow-sm ${isHigh ? 'bg-gradient-to-r from-amber-400 to-rose-500' : 'bg-gradient-to-r from-emerald-400 to-indigo-400'}`} 
            style={{ width: `${Math.min(pct, 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
