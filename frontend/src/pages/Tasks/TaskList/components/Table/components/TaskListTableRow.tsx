import { AlertTriangle, Calendar, Clock, Edit2, Trash2, Loader2 } from 'lucide-react'
import { Checkbox, App, Avatar } from 'antd'
import type { Task } from '@/pages/Tasks/types/task.types'
import { formatDate, checkIsOverdue } from '@/pages/Tasks/utils/task.utils'
import { TaskStatusBadge } from '@/pages/Tasks/components/badges/TaskStatusBadge'
import { TaskPriorityBadge } from '@/pages/Tasks/components/badges/TaskPriorityBadge'
import { useTaskDelete } from '@/pages/Tasks/hooks/useTaskActions'
import { useUpdateTaskStatusMutation } from '@/services/queries/task.query'
import { useAppSelector } from '@/store/hooks'

interface TaskListTableRowProps {
  task: Task
  index: number
  onEdit?: () => void
  isAdminOrManager: boolean
}

export const TaskListTableRow = ({ task, index, onEdit, isAdminOrManager }: TaskListTableRowProps) => {
  const currentUser = useAppSelector(state => state.auth.user)
  const isAssignedToMe = task.assigneeId && typeof task.assigneeId !== 'string' 
    ? task.assigneeId._id === currentUser?._id 
    : task.assigneeId === currentUser?._id
  const canEdit = isAdminOrManager || isAssignedToMe

  const isOverdue = checkIsOverdue(task.dueDate)
  const { confirmDelete, isPending: isDeleting } = useTaskDelete()
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTaskStatusMutation()
  const { message } = App.useApp()
  
  const handleToggleStatus = () => {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE'
    updateStatus(
      { id: task._id, status: newStatus },
      {
        onError: (error: any) => {
          message.error(error.response?.data?.error || error.message || 'Cập nhật trạng thái thất bại')
        }
      }
    )
  }

  return (
    <tr className={`hover:bg-white/80 transition-colors group ${index % 2 === 1 ? 'bg-white/20' : ''}`}>
      <td className="py-4 px-6 align-middle">
        <div className="flex items-start gap-4">
          <div className="pt-1">
            {isUpdatingStatus ? (
              <Loader2 className="animate-spin text-indigo-600" size={16} />
            ) : (
              <Checkbox 
                checked={task.status === 'DONE'} 
                onChange={handleToggleStatus}
                disabled={!canEdit}
                className="accent-indigo-600" 
              />
            )}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <span 
              className={`text-base font-semibold tracking-tight transition-colors ${canEdit ? 'cursor-pointer group-hover:text-indigo-600' : 'cursor-default opacity-80'} ${task.status === 'DONE' ? 'text-slate-500 line-through' : 'text-slate-900'}`}
              onClick={canEdit ? onEdit : undefined}
            >
              {task.title}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {task.tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] tracking-wide font-bold uppercase border border-white/40">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </td>
      
      <td className="py-4 px-6 align-middle">
        <TaskStatusBadge status={task.status} />
      </td>
      
      <td className="py-4 px-6 align-middle">
        <TaskPriorityBadge priority={task.priority} />
      </td>

      <td className="py-4 px-6 align-middle">
        {task.assigneeId && typeof task.assigneeId !== 'string' ? (
          <div className="flex items-center gap-2">
            {task.assigneeId.avatar ? (
              <Avatar src={task.assigneeId.avatar} alt={task.assigneeId.fullName} size="small" />
            ) : (
              <Avatar size="small" style={{ backgroundColor: '#e0e7ff', color: '#4338ca', fontWeight: 'bold', fontSize: '10px' }}>
                {task.assigneeId.fullName.charAt(0).toUpperCase()}
              </Avatar>
            )}
            <span className="text-sm font-medium text-slate-700">{task.assigneeId.fullName}</span>
          </div>
        ) : (
          <span className="text-sm text-slate-400 italic">Unassigned</span>
        )}
      </td>
      
      <td className="py-4 px-6 align-middle">
        <div className={`text-sm font-medium flex items-center gap-1.5 ${isOverdue ? 'text-rose-600' : 'text-slate-600'}`}>
          {isOverdue ? <AlertTriangle size={18} /> : (task.priority === 'HIGH' ? <Clock size={18} className="text-amber-600" /> : <Calendar size={18} />)}
          <span className={task.priority === 'HIGH' && !isOverdue ? 'text-amber-600' : ''}>{formatDate(task.dueDate)}</span>
          {isOverdue && (
            <span className="text-[10px] bg-rose-100/70 text-rose-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Overdue</span>
          )}
        </div>
      </td>
      
      <td className="py-4 px-6 align-middle text-right">
        <div className="inline-flex items-center gap-1">
          {canEdit && (
            <button 
              onClick={onEdit}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors" 
              title="Edit Task"
            >
              <Edit2 size={18} />
            </button>
          )}
          {isAdminOrManager && (
            <button 
              onClick={() => confirmDelete(task)}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50" 
              title="Delete Task"
            >
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}
