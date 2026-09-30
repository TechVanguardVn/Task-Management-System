import type { Task } from '@/modules/tasks/types/taskType';
import type { TaskListProps } from '@/modules/tasks/types/taskListType';

const statusColors: Record<Task['status'], string> = {
  TODO: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
} as const;

const priorityColors: Record<Task['priority'], string> = {
  LOW: 'bg-blue-100 text-blue-700',
  MEDIUM: 'bg-violet-100 text-violet-700',
  HIGH: 'bg-rose-100 text-rose-700',
} as const;

export const TaskList: React.FC<TaskListProps> = ({ tasks, onEdit, onDelete, onStatusChange }) => {
  if (!tasks.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-gray-500">
        Chưa có công việc nào. Hãy thêm task đầu tiên.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div key={task.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${statusColors[task.status]}`}>
                  {task.status}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priorityColors[task.priority]}`}>
                  {task.priority}
                </span>
              </div>

              {task.description && <p className="text-sm text-gray-600">{task.description}</p>}

              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                {task.due_date && <span>Hạn: {task.due_date}</span>}
                {task.updated_at && <span>Cập nhật: {task.updated_at}</span>}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value as Task['status'])}
                className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>

              <button
                onClick={() => onEdit(task)}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
              >
                Sửa
              </button>

              <button
                onClick={() => onDelete(task)}
                className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 text-sm"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
