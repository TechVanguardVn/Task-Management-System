import { Link } from 'react-router'
import { Icon } from '../Icon.jsx'
import { formatDueDate } from '../dashboard/presentation.js'

export function ProjectCard({ project, onAction }) {
  const archived = project.status === 'ARCHIVED'
  const color =
    project.color && CSS.supports('color', project.color)
      ? project.color
      : '#6366f1'
  return (
    <article
      className={`project-card${archived ? ' project-archived' : ''}`}
      style={{ borderTopColor: color }}
    >
      <div className="project-card-top">
        <span className="project-card-symbol" style={{ color }}>
          <Icon name="projects" />
        </span>
        <span className={`project-status${archived ? ' archived' : ''}`}>
          {archived ? 'Đã lưu trữ' : 'Đang hoạt động'}
        </span>
      </div>
      <h2>
        <Link to={`/projects/${encodeURIComponent(project.id)}/tasks`}>
          {project.name}
        </Link>
      </h2>
      <p className="project-card-description">
        {project.description || 'Chưa có mô tả.'}
      </p>
      <div className="project-card-dates">
        {project.startDate && (
          <span>
            <Icon name="calendar" className="size-4" />
            Bắt đầu:{' '}
            <time dateTime={project.startDate}>
              {formatDueDate(project.startDate)}
            </time>
          </span>
        )}
        {project.dueDate && (
          <span>
            <Icon name="calendar" className="size-4" />
            Hạn:{' '}
            <time dateTime={project.dueDate}>
              {formatDueDate(project.dueDate)}
            </time>
          </span>
        )}
        {!project.startDate && !project.dueDate && (
          <span>Chưa đặt thời gian</span>
        )}
      </div>
      {project.color && (
        <p className="project-color-label">Màu: {project.color}</p>
      )}
      <div className="project-card-actions">
        <button type="button" onClick={() => onAction('edit', project)}>
          Chỉnh sửa
        </button>
        {!archived && (
          <button type="button" onClick={() => onAction('archive', project)}>
            Lưu trữ
          </button>
        )}
        <button
          type="button"
          className="project-delete-action"
          onClick={() => onAction('delete', project)}
        >
          Xóa
        </button>
      </div>
      <Link
        className="project-tasks-link"
        to={`/projects/${encodeURIComponent(project.id)}/tasks`}
      >
        Xem công việc <span aria-hidden="true">→</span>
      </Link>
    </article>
  )
}
