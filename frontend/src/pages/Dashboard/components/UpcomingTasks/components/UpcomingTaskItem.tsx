import { Avatar } from 'antd'
import type { UpcomingTask } from '../../../types/dashboard.types'

interface Props {
  task: UpcomingTask
}

export const UpcomingTaskItem = ({ task }: Props) => {
  const getPriorityClasses = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-rose-100 text-rose-600'
      case 'MEDIUM': return 'bg-amber-100 text-amber-600'
      case 'LOW': return 'bg-emerald-100 text-emerald-600'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  const isHighPriority = task.priority === 'HIGH'

  return (
    <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/60 hover:bg-white/90 backdrop-blur-xl shadow-sm transition-all hover:scale-[1.005] border border-transparent hover:border-slate-100">
      <div className="flex items-center gap-4 min-w-0">
        <Avatar src={task.assignee.avatar} alt={task.assignee.fullName} size={40} className="shadow-sm rounded-xl shrink-0">
          {task.assignee.fullName.charAt(0)}
        </Avatar>
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-slate-900 font-bold truncate">{task.title}</span>
          <span className="text-xs text-slate-500 truncate">Assigned to {task.assignee.fullName}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 self-end sm:self-auto shrink-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${getPriorityClasses(task.priority)}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-1 text-slate-500 text-xs font-medium">
          <span className={isHighPriority ? 'text-rose-600' : ''}>{task.dueDate}</span>
        </div>
      </div>
    </div>
  )
}
