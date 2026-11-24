import { useDraggable } from '@dnd-kit/react'
import { priorityLabels } from '../dashboard/presentation.js'
import { formatDueDate } from '../dashboard/presentation.js'
import { dueIndicator, taskStatuses } from '../tasks/taskModel.js'
import { columnTitles } from './kanbanModel.js'

export function KanbanCard({ task, locked, pending, now, onOpen, onStatus }) {
  const { ref, handleRef, isDragging } = useDraggable({
    id: task.id,
    type: 'task',
    disabled: locked || pending,
    data: { task },
  })
  const due = dueIndicator(task, now)
  return (
    <article
      ref={ref}
      className={`kanban-card ${isDragging ? 'kanban-card-dragging' : ''} ${task.status === 'DONE' ? 'kanban-card-done' : ''}`}
      data-task-id={task.id}
    >
      <div className="kanban-card-top">
        <button
          ref={handleRef}
          type="button"
          className="kanban-drag-handle"
          disabled={locked || pending}
          aria-label={`Kéo công việc: ${task.title}`}
          aria-roledescription="Công việc có thể kéo"
          aria-describedby="kanban-drag-help"
        >
          ⠿
        </button>
        <span
          className={`task-priority priority-${task.priority.toLowerCase()}`}
        >
          {priorityLabels[task.priority]}
        </span>
      </div>
      <button
        className="kanban-card-open"
        type="button"
        disabled={pending}
        onClick={() => onOpen(task.id)}
      >
        <h3>{task.title}</h3>
        {task.description && <p>{task.description}</p>}
      </button>
      {task.dueDate && (
        <div className="kanban-card-due">
          <time dateTime={task.dueDate}>{formatDueDate(task.dueDate)}</time>
          {due && (
            <span className={`task-due-indicator ${due.kind}`}>
              {due.label}
            </span>
          )}
        </div>
      )}
      <label className="kanban-card-status">
        <span>Chuyển sang</span>
        <select
          aria-label={`Trạng thái: ${task.title}`}
          value={task.status}
          disabled={locked || pending}
          onChange={(event) => onStatus(task, event.target.value)}
        >
          {taskStatuses.map((status) => (
            <option key={status} value={status}>
              {columnTitles[status]}
            </option>
          ))}
        </select>
      </label>
    </article>
  )
}
