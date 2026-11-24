import { Icon } from '../Icon.jsx'
import { formatCount } from './presentation.js'
import { ResourceState } from './ResourceState.jsx'
import { BackgroundSync } from '../BackgroundSync.jsx'

const cards = [
  { key: 'totalTasks', label: 'Tổng số công việc', icon: 'tasks' },
  { key: 'todoTasks', label: 'Cần thực hiện', icon: 'calendar' },
  { key: 'inProgressTasks', label: 'Đang tiến hành', icon: 'progress' },
  { key: 'doneTasks', label: 'Đã hoàn thành', icon: 'done' },
]

export function SummaryCards({ resource }) {
  return (
    <section
      aria-label="Thống kê công việc"
      className="dashboard-summary-section"
    >
      <BackgroundSync resource={resource} />
      {resource.status === 'error' ? (
        <ResourceState resource={resource} />
      ) : (
        <div
          className="dashboard-summary-grid"
          aria-busy={resource.status === 'loading'}
        >
          {cards.map(({ key, label, icon }) => (
            <article className="dashboard-summary-card" key={key}>
              <div>
                <h2>{label}</h2>
                {resource.status === 'success' ? (
                  <p className="dashboard-count" data-count={key}>
                    {formatCount(resource.data[key])}
                  </p>
                ) : (
                  <span
                    className="dashboard-count-placeholder"
                    aria-hidden="true"
                  />
                )}
              </div>
              <span className="dashboard-summary-icon">
                <Icon name={icon} />
              </span>
            </article>
          ))}
          {resource.status === 'loading' && (
            <span className="sr-only" role="status">
              Đang tải thống kê công việc…
            </span>
          )}
        </div>
      )}
    </section>
  )
}
