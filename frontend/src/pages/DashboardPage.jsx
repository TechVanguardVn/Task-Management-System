import { keys } from '../query/keys.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { dashboardApi } from '../api/dashboard.js'
import { useAuth } from '../hooks/useAuth.js'
import { useApiResource } from '../hooks/useApiResource.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { Icon } from '../components/Icon.jsx'
import { SummaryCards } from '../components/dashboard/SummaryCards.jsx'
import { StatusDistribution } from '../components/dashboard/StatusDistribution.jsx'
import { CompletionOverview } from '../components/dashboard/CompletionOverview.jsx'
import { DeadlineList } from '../components/dashboard/DeadlineList.jsx'
import { RecentProjects } from '../components/dashboard/RecentProjects.jsx'
import { ResourceState } from '../components/dashboard/ResourceState.jsx'
import { greetingAt, shortName } from '../components/dashboard/presentation.js'
import '../components/dashboard/dashboard.css'

export function DashboardPage() {
  usePageTitle('Tổng quan', 'TaskFlow')
  const { user } = useAuth()
  const [now, setNow] = useState(() => new Date())
  const [upcomingPage, setUpcomingPage] = useState(0)
  const [overduePage, setOverduePage] = useState(0)
  const summary = useApiResource(dashboardApi.summary, keys.summary())
  const loadUpcoming = useCallback(
    (signal) => dashboardApi.upcoming(upcomingPage, signal),
    [upcomingPage],
  )
  const loadOverdue = useCallback(
    (signal) => dashboardApi.overdue(overduePage, signal),
    [overduePage],
  )
  const upcoming = useApiResource(loadUpcoming, keys.upcoming(upcomingPage))
  const overdue = useApiResource(loadOverdue, keys.overdue(null, overduePage))
  const projects = useApiResource(dashboardApi.projects, keys.projects(0, 4))
  const projectMap = useMemo(
    () =>
      new Map(
        projects.data?.content.map((project) => [project.id, project]) || [],
      ),
    [projects.data],
  )
  const loading = [summary, upcoming, overdue, projects].some(
    (resource) => resource.status === 'loading',
  )
  const name = shortName(user.name)

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  function refresh() {
    summary.retry()
    upcoming.retry()
    overdue.retry()
    projects.retry()
  }

  return (
    <div className="dashboard">
      <header className="dashboard-heading">
        <div>
          <h1>
            {greetingAt(now)}
            {name ? `, ${name}` : ''}!
          </h1>
          <p>
            Hôm nay là{' '}
            {new Intl.DateTimeFormat('vi-VN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(now)}
            . Cùng xem công việc của bạn.
          </p>
        </div>
        <button
          type="button"
          className="dashboard-refresh"
          disabled={loading}
          onClick={refresh}
        >
          <Icon name="progress" className="size-4" />
          {loading ? 'Đang tải…' : 'Làm mới'}
        </button>
      </header>
      <SummaryCards resource={summary} />
      <div className="dashboard-chart-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Tiến độ hoàn thành</h2>
              <p>Tổng quan tất cả công việc của bạn</p>
            </div>
            <span className="dashboard-card-symbol">
              <Icon name="done" />
            </span>
          </div>
          <ResourceState resource={summary}>
            {summary.data && <CompletionOverview summary={summary.data} />}
          </ResourceState>
        </section>
        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>Phân bố trạng thái</h2>
              <p>Toàn bộ không gian làm việc</p>
            </div>
          </div>
          <ResourceState resource={summary}>
            {summary.data && <StatusDistribution summary={summary.data} />}
          </ResourceState>
        </section>
      </div>
      <div className="dashboard-lists-grid">
        <section className="dashboard-card">
          <div className="dashboard-card-heading">
            <div>
              <h2>
                <Icon name="calendar" />
                Hạn chót sắp tới
              </h2>
              <p>Hôm nay và 7 ngày tiếp theo</p>
            </div>
            <Link to="/tasks">
              Xem tất cả công việc <span aria-hidden="true">→</span>
            </Link>
          </div>
          <DeadlineList
            resource={upcoming}
            projects={projectMap}
            onPageChange={setUpcomingPage}
          />
        </section>
        <section className="dashboard-card dashboard-overdue">
          <div className="dashboard-card-heading">
            <div>
              <h2>
                <Icon name="calendar" />
                Công việc quá hạn
              </h2>
              <p>Các công việc chưa hoàn thành đã đến hạn</p>
            </div>
          </div>
          <DeadlineList
            resource={overdue}
            overdue
            projects={projectMap}
            onPageChange={setOverduePage}
          />
        </section>
      </div>
      <section className="dashboard-card">
        <div className="dashboard-card-heading">
          <div>
            <h2>
              <Icon name="projects" />
              Dự án gần đây
            </h2>
            <p>Các dự án được tạo gần nhất</p>
          </div>
          <Link to="/projects">
            Xem dự án <span aria-hidden="true">→</span>
          </Link>
        </div>
        <RecentProjects resource={projects} />
      </section>
    </div>
  )
}
