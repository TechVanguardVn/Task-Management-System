import { Link } from 'react-router'
import { Icon } from '../Icon.jsx'
import { formatCount, formatDueDate, priorityLabels } from './presentation.js'
import { ResourceState } from './ResourceState.jsx'

export function DeadlineList({
  resource,
  overdue = false,
  projects,
  onPageChange,
}) {
  const page = resource.data
  return (
    <ResourceState
      resource={resource}
      onReset={page?.page > 0 ? () => onPageChange(0) : undefined}
      emptyMessage={
        overdue
          ? 'Không có công việc nào quá hạn.'
          : 'Không có công việc nào sắp đến hạn.'
      }
    >
      <ul className="dashboard-task-list">
        {page?.content.map((task) => (
          <li key={task.id} className={overdue ? 'is-overdue' : ''}>
            <div className="dashboard-task-top">
              <Link
                to={`/tasks/${encodeURIComponent(task.id)}`}
                className="dashboard-task-title"
              >
                {task.title}
              </Link>
              {task.priority && (
                <span
                  className={`dashboard-priority priority-${task.priority.toLowerCase()}`}
                >
                  {priorityLabels[task.priority]}
                </span>
              )}
            </div>
            <p className="dashboard-task-project">
              {projects.get(task.projectId)?.name ||
                `Dự án #${task.projectId.slice(0, 8)}`}
            </p>
            <p className="dashboard-due">
              <Icon name="calendar" className="size-4" />
              <time dateTime={task.dueDate}>{formatDueDate(task.dueDate)}</time>
              {overdue && <span>Quá hạn</span>}
            </p>
          </li>
        ))}
      </ul>
      {page && page.totalPages > 1 && (
        <nav
          className="dashboard-pagination"
          aria-label={
            overdue
              ? 'Phân trang công việc quá hạn'
              : 'Phân trang công việc sắp đến hạn'
          }
        >
          <button
            type="button"
            disabled={page.page === 0}
            onClick={() => onPageChange(page.page - 1)}
          >
            Trước
          </button>
          <span>
            {formatCount(page.page + 1)} / {formatCount(page.totalPages)}
          </span>
          <button
            type="button"
            disabled={page.page + 1 >= page.totalPages}
            onClick={() => onPageChange(page.page + 1)}
          >
            Sau
          </button>
        </nav>
      )}
      {page && page.totalElements > 0 && (
        <p className="dashboard-list-total">
          {formatCount(page.totalElements)} công việc
        </p>
      )}
    </ResourceState>
  )
}
