import { Link } from 'react-router'
import {
  formatDueDate,
  priorityLabels,
  statusLabels,
} from '../dashboard/presentation.js'
import { dueIndicator, taskStatuses } from './taskModel.js'

export function TaskTable({
  tasks,
  project,
  projects = [],
  now,
  pending,
  onEdit,
  onDelete,
  onStatus,
}) {
  return (
    <div className="task-table-container">
      <table className="task-table">
        <caption className="sr-only">
          {project.id === 'all'
            ? 'Công việc trong tất cả dự án'
            : `Công việc trong dự án ${project.name}`}
        </caption>
        <thead>
          <tr>
            {[
              'Tên công việc',
              'Dự án',
              'Trạng thái',
              'Ưu tiên',
              'Hạn hoàn thành',
              'Thao tác',
            ].map((title) => (
              <th key={title} scope="col">
                {title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const owner =
              project.id === 'all'
                ? projects.find((item) => item.id === task.projectId)
                : project
            const locked = owner?.status !== 'ACTIVE'
            const due = dueIndicator(task, now)
            return (
              <tr
                key={task.id}
                className={`${task.status === 'DONE' ? 'task-completed' : ''} ${due?.kind === 'overdue' ? 'task-is-overdue' : ''}`}
              >
                <td data-label="Tên công việc">
                  <Link to={`/tasks/${encodeURIComponent(task.id)}`}>
                    {task.title}
                  </Link>
                  {task.completedAt && (
                    <span className="task-completed-at">
                      Hoàn thành:{' '}
                      {new Intl.DateTimeFormat('vi-VN', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(task.completedAt))}
                    </span>
                  )}
                </td>
                <td data-label="Dự án">
                  <span>{owner?.name || 'Dự án không còn khả dụng'}</span>
                </td>
                <td data-label="Trạng thái">
                  <select
                    className={`task-status-select status-${task.status.toLowerCase()}`}
                    aria-label={`Trạng thái: ${task.title}`}
                    value={task.status}
                    disabled={locked || pending}
                    onChange={(event) => onStatus(task, event.target.value)}
                  >
                    {taskStatuses.map((value) => (
                      <option key={value} value={value}>
                        {statusLabels[value]}
                      </option>
                    ))}
                  </select>
                </td>
                <td data-label="Ưu tiên">
                  <span
                    className={`task-priority priority-${task.priority.toLowerCase()}`}
                  >
                    {priorityLabels[task.priority]}
                  </span>
                </td>
                <td data-label="Hạn hoàn thành">
                  <span className="task-due-date">
                    {task.dueDate ? (
                      <time dateTime={task.dueDate}>
                        {formatDueDate(task.dueDate)}
                      </time>
                    ) : (
                      'Chưa đặt hạn'
                    )}
                    {due && (
                      <span className={`task-due-indicator ${due.kind}`}>
                        {due.label}
                      </span>
                    )}
                  </span>
                </td>
                <td data-label="Thao tác">
                  <div className="task-row-actions">
                    <button
                      type="button"
                      disabled={locked || pending}
                      onClick={() => onEdit(task)}
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      disabled={locked || pending}
                      onClick={() => onDelete(task)}
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
