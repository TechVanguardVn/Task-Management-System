import { keys } from '../query/keys.js'
import { useCallback } from 'react'
import { Link, useParams } from 'react-router'
import { dashboardApi } from '../api/dashboard.js'
import { useApiResource } from '../hooks/useApiResource.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { ResourceState } from '../components/dashboard/ResourceState.jsx'
import {
  formatDueDate,
  priorityLabels,
  statusLabels,
} from '../components/dashboard/presentation.js'
import '../components/dashboard/dashboard.css'

export function TaskDetailsPage() {
  const { taskId } = useParams()
  const load = useCallback(
    (signal) => dashboardApi.task(taskId, signal),
    [taskId],
  )
  const resource = useApiResource(load, keys.task(taskId))
  usePageTitle(resource.data?.title || 'Chi tiết công việc', 'TaskFlow')
  return (
    <div className="dashboard">
      <Link className="dashboard-back" to="/dashboard">
        ← Về tổng quan
      </Link>
      <section className="dashboard-card dashboard-task-details">
        <ResourceState resource={resource}>
          {resource.data && (
            <>
              <span className="dashboard-detail-label">Chi tiết công việc</span>
              <h1>{resource.data.title}</h1>
              <p className="dashboard-task-description">
                {resource.data.description || 'Chưa có mô tả.'}
              </p>
              <dl>
                <div>
                  <dt>Trạng thái</dt>
                  <dd>{statusLabels[resource.data.status]}</dd>
                </div>
                <div>
                  <dt>Ưu tiên</dt>
                  <dd>{priorityLabels[resource.data.priority]}</dd>
                </div>
                <div>
                  <dt>Hạn hoàn thành</dt>
                  <dd>{formatDueDate(resource.data.dueDate)}</dd>
                </div>
                <div>
                  <dt>Mã dự án</dt>
                  <dd>{resource.data.projectId}</dd>
                </div>
              </dl>
              <Link
                to={`/tasks?projectId=${encodeURIComponent(resource.data.projectId)}`}
              >
                Xem công việc trong dự án →
              </Link>
            </>
          )}
        </ResourceState>
      </section>
    </div>
  )
}
