import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight } from 'lucide-react'
import { Skeleton } from 'antd'
import { UpcomingTaskItem } from './components/UpcomingTaskItem'
import type { UpcomingTask } from '../../types/dashboard.types'

interface Props {
  tasks: UpcomingTask[]
  isLoading: boolean
}

export const UpcomingTasks = ({ tasks, isLoading }: Props) => {
  return (
    <div className="bg-white/75 backdrop-blur-3xl rounded-3xl p-8 shadow-[0_20px_48px_rgba(15,23,42,0.05),0_1px_0_0_rgba(255,255,255,0.9)] flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <CalendarDays size={18} />
            </div>
            <h2 className="text-[18px] text-slate-900 font-semibold tracking-tight">Upcoming Deadlines</h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-900 text-[11px] font-bold uppercase">
            {tasks.length} Tasks
          </span>
        </div>
        <div className="h-px w-full bg-slate-200 my-6"></div>

        <div className="flex flex-col gap-3">
          {isLoading ? (
            <>
              <Skeleton.Button active style={{ height: 64, borderRadius: 16 }} className="!w-full" />
              <Skeleton.Button active style={{ height: 64, borderRadius: 16 }} className="!w-full" />
            </>
          ) : (
            tasks.map(task => (
              <UpcomingTaskItem key={task.id} task={task} />
            ))
          )}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between pt-4 border-t border-slate-100">
        <span className="text-sm text-slate-500">Keep tasks up to date to maintain team velocity</span>
        <Link to="/task-list" className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors">
          View All Tasks
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  )
}
