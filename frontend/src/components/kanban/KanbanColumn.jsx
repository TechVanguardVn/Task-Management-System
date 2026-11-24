import { useDroppable } from '@dnd-kit/react'
import { useKanbanColumn } from '../../hooks/useKanbanColumn.js'
import { taskError } from '../tasks/taskModel.js'
import { formatCount } from '../dashboard/presentation.js'
import { columnTasks, columnTitles } from './kanbanModel.js'
import { KanbanCard } from './KanbanCard.jsx'

export function KanbanColumn({
  projectId,
  status,
  search,
  priority,
  locked,
  pendingIds,
  now,
  onOpen,
  onStatus,
  onCreate,
}) {
  const resource = useKanbanColumn(projectId, status, search, priority)
  const { ref, isDropTarget } = useDroppable({
    id: status,
    accept: 'task',
    disabled: locked,
  })
  const tasks = columnTasks(resource.tasks, status, null)
  return (
    <section
      ref={ref}
      className={`kanban-column kanban-column-${status.toLowerCase()} ${isDropTarget ? 'kanban-column-target' : ''}`}
      aria-labelledby={`kanban-${status}`}
      data-status={status}
    >
      {resource.isFetching && resource.status === 'success' && (
        <p className="kanban-loaded-count" role="status">
          Đang đồng bộ nền…
        </p>
      )}
      {resource.backgroundError && (
        <p className="project-error" role="alert">
          Chưa thể đồng bộ. Dữ liệu đang hiển thị có thể đã cũ.{' '}
          <button onClick={resource.retry}>Thử lại</button>
        </p>
      )}
      <header>
        <h2 id={`kanban-${status}`}>
          <span className="kanban-column-dot" />
          {columnTitles[status]}
          <span
            className="kanban-column-count"
            aria-label="Tổng công việc phù hợp"
          >
            {resource.total === null ? '—' : formatCount(resource.total)}
          </span>
        </h2>
        <button
          type="button"
          disabled={locked}
          aria-label={`Thêm công việc: ${columnTitles[status]}`}
          onClick={() => onCreate(status)}
        >
          +
        </button>
      </header>
      {resource.status === 'loading' ? (
        <div className="kanban-column-state" role="status">
          <div className="task-skeleton" />
          <div className="task-skeleton" />
          Đang tải công việc…
        </div>
      ) : resource.status === 'error' ? (
        <div className="kanban-column-state" role="alert">
          <p>{taskError(resource.error)}</p>
          <button className="project-button-secondary" onClick={resource.retry}>
            Thử lại cột
          </button>
        </div>
      ) : (
        <>
          <p className="kanban-loaded-count">
            Đã tải {formatCount(resource.tasks.length)} /{' '}
            {formatCount(resource.total)} công việc phù hợp
          </p>
          {isDropTarget && (
            <p className="kanban-drop-hint">
              Thả để chuyển sang {columnTitles[status].toLowerCase()}
            </p>
          )}
          <div className="kanban-card-list">
            {tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                locked={locked}
                pending={pendingIds.has(task.id)}
                now={now}
                onOpen={onOpen}
                onStatus={onStatus}
              />
            ))}
          </div>
          {!tasks.length && (
            <p className="kanban-column-state">
              {search || priority
                ? 'Không có công việc phù hợp trong cột này.'
                : 'Chưa có công việc trong cột này.'}
            </p>
          )}
          {resource.moreError && (
            <p className="project-error" role="alert">
              {taskError(resource.moreError)}
            </p>
          )}
          {resource.page + 1 < resource.totalPages && (
            <button
              className="kanban-load-more"
              disabled={resource.loadingMore || pendingIds.size > 0}
              onClick={resource.loadMore}
            >
              {resource.loadingMore
                ? 'Đang tải thêm…'
                : resource.moreError
                  ? 'Thử tải thêm'
                  : 'Tải thêm công việc'}
            </button>
          )}
          {!locked && (
            <button
              className="kanban-add"
              disabled={pendingIds.size > 0}
              onClick={() => onCreate(status)}
            >
              + Thêm công việc
            </button>
          )}
        </>
      )}
    </section>
  )
}
