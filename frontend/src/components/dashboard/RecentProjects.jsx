import { formatDueDate } from './presentation.js'
import { ResourceState } from './ResourceState.jsx'

export function RecentProjects({ resource }) {
  return (
    <ResourceState resource={resource} emptyMessage="Bạn chưa có dự án nào.">
      <ul className="dashboard-project-list">
        {resource.data?.content.map((project) => (
          <li key={project.id}>
            <div>
              <span className="dashboard-project-mark" aria-hidden="true">
                {[...project.name.trim()][0]?.toLocaleUpperCase('vi-VN')}
              </span>
              <h3>{project.name}</h3>
              <span
                className={`dashboard-project-status ${project.status === 'ARCHIVED' ? 'is-archived' : ''}`}
              >
                {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}
              </span>
            </div>
            <p>
              {project.dueDate
                ? `Hạn hoàn thành: ${formatDueDate(project.dueDate)}`
                : 'Chưa đặt hạn hoàn thành'}
            </p>
          </li>
        ))}
      </ul>
    </ResourceState>
  )
}
