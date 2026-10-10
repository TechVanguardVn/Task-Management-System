import { Link } from 'react-router-dom'
import { Users, ChevronRight } from 'lucide-react'
import { Skeleton } from 'antd'
import { WorkloadItem } from './components/WorkloadItem'
import type { WorkloadData } from '../../types/dashboard.types'

interface Props {
  workload: WorkloadData[]
  isLoading: boolean
  workspaceId: string
}

export const ResourceWorkload = ({ workload, isLoading, workspaceId }: Props) => {
  return (
    <div className="bg-white/75 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_20px_48px_rgba(15,23,42,0.05),0_1px_0_0_rgba(255,255,255,0.9)] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Users size={18} />
            </div>
            <h2 className="text-[18px] text-slate-900 font-semibold tracking-tight">Resource Workload</h2>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Load
          </span>
        </div>
        <div className="h-px w-full bg-slate-200 my-6"></div>

        <div className="flex flex-col gap-4">
          {isLoading ? (
            <>
              <Skeleton.Button active style={{ height: 80, borderRadius: 16 }} className="!w-full" />
              <Skeleton.Button active style={{ height: 80, borderRadius: 16 }} className="!w-full" />
            </>
          ) : (
            workload.map((item, idx) => (
              <WorkloadItem key={idx} item={item} />
            ))
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-sm text-slate-500">Manage team allocation to avoid burnout</span>
        <Link to={`/workspaces/${workspaceId}/members`} className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors">
          Manage Allocation
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  )
}
