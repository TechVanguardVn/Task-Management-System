import { ChevronsUpDown, ArrowDown } from 'lucide-react'
import type { Task } from '@/pages/Tasks/types/task.types'
import { TaskListTableRow } from './components/TaskListTableRow'

interface TaskListTableProps {
  tasks: Task[]
  onEditTask?: (task: Task) => void
  isAdminOrManager: boolean
}

export const TaskListTable = ({ tasks, onEditTask, isAdminOrManager }: TaskListTableProps) => {
  return (
    <div className="bg-white/65 backdrop-blur-2xl rounded-2xl shadow-[0_16px_36px_-6px_rgba(15,23,42,0.06),inset_0_1px_0_0_rgba(255,255,255,0.9)] overflow-hidden mb-6">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-white/60">
              <th className="py-4 px-6 text-xs text-slate-500 tracking-wider uppercase font-bold" scope="col">
                <div className="flex items-center gap-2">
                  <span>Task Name</span>
                  <ChevronsUpDown size={14} />
                </div>
              </th>
              <th className="py-4 px-6 text-xs text-slate-500 tracking-wider uppercase font-bold" scope="col">Status</th>
              <th className="py-4 px-6 text-xs text-slate-500 tracking-wider uppercase font-bold" scope="col">Priority</th>
              <th className="py-4 px-6 text-xs text-slate-500 tracking-wider uppercase font-bold" scope="col">Assignee</th>
              <th className="py-4 px-6 text-xs text-slate-500 tracking-wider uppercase font-bold" scope="col">
                <div className="flex items-center gap-2">
                  <span>Due Date</span>
                  <ArrowDown size={14} />
                </div>
              </th>
              <th className="py-4 px-6 text-right text-xs text-slate-500 tracking-wider uppercase font-bold" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/60">
            {tasks.map((task, index) => (
              <TaskListTableRow 
                key={task._id} 
                task={task} 
                index={index} 
                onEdit={() => onEditTask?.(task)}
                isAdminOrManager={isAdminOrManager}
              />
            ))}
            
            {tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No tasks found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
