import { keys } from '../../query/keys.js'
import { BackgroundSync } from '../BackgroundSync.jsx'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTaskScopeResource } from '../../hooks/useTaskScopeResource.js'
import { notify } from '../../lib/notify.js'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { tasksApi } from '../../api/tasks.js'
import { useApiResource } from '../../hooks/useApiResource.js'
import { usePageTitle } from '../../hooks/usePageTitle.js'
import { useTaskMutation } from '../../hooks/useTaskMutation.js'
import {
  priorityLabels,
  statusLabels,
  formatCount,
} from '../dashboard/presentation.js'
import { TaskEditor } from './TaskEditor.jsx'
import { TaskDeleteDialog } from './TaskDeleteDialog.jsx'
import { TaskTable } from './TaskTable.jsx'
import {
  defaultTaskQuery,
  taskError,
  taskPriorities,
  taskStatuses,
} from './taskModel.js'
import '../projects/projects.css'
import './tasks.css'

function TaskState({ resource, children }) {
  if (resource.status === 'loading')
    return (
      <div className="task-state" role="status">
        <div className="task-skeleton" />
        <div className="task-skeleton" />
        <span>Đang tải công việc…</span>
      </div>
    )
  if (resource.status === 'error')
    return (
      <div className="task-state" role="alert">
        <p>{taskError(resource.error)}</p>
        <button className="project-button-secondary" onClick={resource.retry}>
          Thử lại
        </button>
      </div>
    )
  return (
    <>
      <BackgroundSync resource={resource} />
      {children}
    </>
  )
}

function TaskScope({ project, projects, selectProject, refreshProjects }) {
  const all = project.id === 'all'
  const scopeId = all ? null : project.id
  const [query, setQuery] = useState(defaultTaskQuery)
  const [search, setSearch] = useState('')
  const [dialog, setDialog] = useState(null)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setQuery((previous) =>
          previous.search === search
            ? previous
            : { ...previous, search, page: 0 },
        ),
      350,
    )
    return () => clearTimeout(timer)
  }, [search])
  const loadSummary = useCallback(
    (signal) => tasksApi.summary(scopeId ?? undefined, signal),
    [scopeId],
  )
  const loadOverdue = useCallback(
    (signal) => tasksApi.overdue(scopeId ?? undefined, signal),
    [scopeId],
  )
  const tasks = useTaskScopeResource(projects, project.id, query)
  const summary = useApiResource(loadSummary, keys.summary(scopeId))
  const overdue = useApiResource(loadOverdue, keys.overdue(scopeId, 0, 1))
  const locked = all
    ? !projects.some((item) => item.status === 'ACTIVE')
    : project.status !== 'ACTIVE'
  const failures = tasks.failures || []
  const failureKey = failures
    .map((failure) => `${failure.project.id}:${failure.at}`)
    .join(',')
  const notified = useRef('')
  useEffect(() => {
    if (failureKey && notified.current !== failureKey) {
      notify.error('Chưa tải đủ công việc của tất cả dự án.', {
        id: 'all-tasks-read-error',
        description: 'Kiểm tra kết nối và thử lại các dự án tải lỗi.',
      })
      notified.current = failureKey
    }
  }, [failureKey])
  const refresh = () => {
    tasks.retry()
    summary.retry()
    overdue.retry()
  }
  const quickStatus = useTaskMutation(() => {}, 'status')
  const change = (name, value) =>
    setQuery((previous) => ({ ...previous, search, [name]: value, page: 0 }))
  const reset = () => {
    setSearch('')
    setQuery({ ...defaultTaskQuery, size: query.size })
  }
  const searching = search !== query.search
  const filtered = Boolean(query.search || query.status || query.priority)
  const page = tasks.data
  const stats = [
    {
      label: 'Cần thực hiện',
      value: summary.data?.todoTasks,
      resource: summary,
      kind: 'todo',
    },
    {
      label: 'Đang tiến hành',
      value: summary.data?.inProgressTasks,
      resource: summary,
      kind: 'progress',
    },
    {
      label: 'Đã hoàn thành',
      value: summary.data?.doneTasks,
      resource: summary,
      kind: 'done',
    },
    {
      label: 'Quá hạn',
      value: overdue.data?.totalElements,
      resource: overdue,
      kind: 'late',
    },
  ]
  function saved(result) {
    const deleting = dialog?.type === 'delete'
    setDialog(null)
    if (!all && result?.projectId && result.projectId !== project.id) {
      selectProject(result.projectId)
      return
    }
    if (deleting && page?.content.length === 1 && query.page > 0)
      setQuery((previous) => ({ ...previous, page: previous.page - 1 }))
  }
  return (
    <>
      <header className="tasks-heading">
        <div>
          <p className="tasks-eyebrow">Không gian làm việc / Việc của tôi</p>
          <h1>Công việc của tôi</h1>
          <p>
            Quản lý, phân loại và cập nhật tiến độ công việc theo từng dự án.
          </p>
        </div>
        <button
          className="project-button-primary"
          disabled={locked || quickStatus.pending}
          onClick={() => setDialog({ type: 'create' })}
        >
          + Thêm công việc
        </button>
      </header>
      <section className="tasks-scope" aria-label="Phạm vi dự án">
        <label htmlFor="task-project-scope">Dự án đang xem</label>
        <select
          id="task-project-scope"
          value={project.id}
          onChange={(event) => selectProject(event.target.value)}
        >
          <option value="all">Tất cả dự án</option>
          {projects.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
              {item.status === 'ARCHIVED' ? ' (Đã lưu trữ)' : ''}
            </option>
          ))}
        </select>
        <button
          className="project-button-secondary"
          onClick={refreshProjects}
          disabled={quickStatus.pending}
        >
          Tải lại dự án
        </button>
        <p>
          {all
            ? 'Danh sách và thống kê thuộc tất cả dự án của bạn.'
            : 'Danh sách và thống kê chỉ thuộc dự án đã chọn.'}
        </p>
      </section>
      {locked && (
        <p className="task-archive-notice" role="status">
          Dự án đã lưu trữ: chỉ có thể xem công việc. Không thể thêm, sửa,
          chuyển, đổi trạng thái hoặc xóa.
        </p>
      )}
      <section
        className="task-statistics"
        aria-label={all ? 'Thống kê tất cả dự án' : 'Thống kê toàn bộ dự án'}
      >
        {stats.map((item) => (
          <article
            key={item.kind}
            className={`task-stat task-stat-${item.kind}`}
          >
            <h2>{item.label}</h2>
            <strong>
              {item.resource.status === 'success'
                ? formatCount(item.value)
                : '—'}
            </strong>
            <span>công việc</span>
            {item.resource.status === 'loading' && (
              <p role="status">Đang tải…</p>
            )}
            {item.resource.status === 'error' && (
              <button onClick={item.resource.retry}>Tải lại thống kê</button>
            )}
          </article>
        ))}
      </section>
      <BackgroundSync resource={summary} />
      <BackgroundSync resource={overdue} />
      <p className="tasks-scope-note">
        {all ? 'Thống kê tất cả dự án' : 'Thống kê toàn bộ dự án'}, không theo
        bộ lọc. Quá hạn được tính theo múi giờ máy chủ; nhãn ngày trên từng công
        việc theo ngày địa phương của bạn.
      </p>
      <section className="task-filters" aria-label="Tìm kiếm và lọc công việc">
        <div className="task-search">
          <label htmlFor="task-search">Tìm theo tên công việc</label>
          <div>
            <input
              id="task-search"
              type="search"
              maxLength={255}
              value={search}
              placeholder="Nhập tên công việc…"
              onChange={(event) => setSearch(event.target.value)}
            />
            <button
              className="project-button-secondary"
              disabled={!search}
              onClick={() => {
                setSearch('')
                setQuery((previous) => ({ ...previous, search: '', page: 0 }))
              }}
            >
              Xóa tìm kiếm
            </button>
          </div>
        </div>
        <div className="task-filter-row">
          <label>
            Trạng thái
            <select
              aria-label="Trạng thái"
              value={query.status}
              onChange={(event) => change('status', event.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {taskStatuses.map((value) => (
                <option key={value} value={value}>
                  {statusLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ưu tiên
            <select
              aria-label="Ưu tiên"
              value={query.priority}
              onChange={(event) => change('priority', event.target.value)}
            >
              <option value="">Tất cả ưu tiên</option>
              {taskPriorities.map((value) => (
                <option key={value} value={value}>
                  {priorityLabels[value]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Sắp xếp
            <select
              aria-label="Sắp xếp"
              value={query.sort}
              onChange={(event) => change('sort', event.target.value)}
            >
              <option value="dueDate,asc">Hạn hoàn thành gần nhất</option>
              <option value="dueDate,desc">Hạn hoàn thành xa nhất</option>
              <option value="createdAt,desc">Mới tạo gần nhất</option>
              <option value="createdAt,asc">Tạo lâu nhất</option>
              <option value="title,asc">Tên A → Z</option>
              <option value="priority,desc">Ưu tiên cao trước</option>
            </select>
          </label>
          <button className="project-button-secondary" onClick={reset}>
            Xóa bộ lọc
          </button>
          <button
            className="project-button-secondary"
            onClick={refresh}
            disabled={tasks.isFetching}
          >
            Tải lại công việc
          </button>
        </div>
      </section>
      {quickStatus.error && (
        <p className="project-error" role="alert">
          {quickStatus.error}{' '}
          <button onClick={refresh}>Tải lại công việc</button>
        </p>
      )}
      {searching && (
        <p className="task-search-pending" role="status">
          Đang chờ tìm kiếm…
        </p>
      )}
      {failures.length > 0 && (
        <div className="project-error" role="alert">
          <p>
            Chưa tải đủ dữ liệu từ:{' '}
            {failures.map((failure) => failure.project.name).join(', ')}.{' '}
            {tasks.data
              ? 'Đang giữ dữ liệu đã tải trước đó; danh sách có thể đã cũ.'
              : 'Chưa thể hiển thị danh sách và tổng số đầy đủ.'}
          </p>
          <p>
            Nếu dữ liệu vừa thay đổi trong lúc tải hoặc kết nối bị gián đoạn,
            hãy thử tải lại.
          </p>
          <button onClick={tasks.retry}>Thử lại các dự án tải lỗi</button>
        </div>
      )}
      <TaskState resource={tasks}>
        {page && (
          <>
            {page.content.length ? (
              <TaskTable
                tasks={page.content}
                project={project}
                projects={projects}
                now={now}
                pending={quickStatus.pending}
                onEdit={(task) => setDialog({ type: 'edit', task })}
                onDelete={(task) => setDialog({ type: 'delete', task })}
                onStatus={(task, status) => {
                  if (
                    projects.find((item) => item.id === task.projectId)
                      ?.status === 'ACTIVE' &&
                    status !== task.status
                  )
                    void quickStatus.run((signal) =>
                      tasksApi.status(task.id, status, signal),
                    )
                }}
              />
            ) : (
              <div className="task-state">
                <h2>
                  {locked
                    ? 'Dự án đã lưu trữ chỉ cho phép xem công việc.'
                    : filtered
                      ? 'Không có kết quả phù hợp'
                      : 'Chưa có công việc trên trang này'}
                </h2>
                <p>
                  {filtered
                    ? 'Thử tên khác hoặc xóa bộ lọc.'
                    : 'Thêm công việc đầu tiên để bắt đầu quản lý dự án.'}
                </p>
                {filtered && (
                  <button className="project-button-secondary" onClick={reset}>
                    Xóa bộ lọc
                  </button>
                )}
                {query.page > 0 && (
                  <button
                    className="project-button-secondary"
                    onClick={() =>
                      setQuery((previous) => ({ ...previous, page: 0 }))
                    }
                  >
                    Về trang đầu
                  </button>
                )}
              </div>
            )}
            <nav className="task-pagination" aria-label="Phân trang công việc">
              <span>
                {formatCount(page.totalElements)} công việc phù hợp · Trang{' '}
                {page.totalPages ? query.page + 1 : 0} / {page.totalPages}
              </span>
              <label>
                Mỗi trang
                <select
                  aria-label="Mỗi trang"
                  value={query.size}
                  onChange={(event) =>
                    change('size', Number(event.target.value))
                  }
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option value={size} key={size}>
                      {size} công việc
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <button
                  className="project-button-secondary"
                  disabled={
                    query.page === 0 || searching || quickStatus.pending
                  }
                  onClick={() =>
                    setQuery((previous) => ({
                      ...previous,
                      page: previous.page - 1,
                    }))
                  }
                >
                  Trước
                </button>
                <button
                  className="project-button-secondary"
                  disabled={
                    query.page + 1 >= page.totalPages ||
                    searching ||
                    quickStatus.pending
                  }
                  onClick={() =>
                    setQuery((previous) => ({
                      ...previous,
                      page: previous.page + 1,
                    }))
                  }
                >
                  Sau
                </button>
              </div>
            </nav>
          </>
        )}
      </TaskState>
      {dialog?.type === 'delete' && (
        <TaskDeleteDialog
          task={dialog.task}
          onClose={() => setDialog(null)}
          onSuccess={saved}
        />
      )}
      {(dialog?.type === 'create' || dialog?.type === 'edit') && (
        <TaskEditor
          task={dialog.task}
          project={
            dialog.task
              ? projects.find((item) => item.id === dialog.task.projectId)
              : project
          }
          projects={projects}
          onClose={() => setDialog(null)}
          onSuccess={saved}
        />
      )}
    </>
  )
}

export function TaskWorkspace({ fixedProjectId }) {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const loadProjects = useCallback((signal) => tasksApi.projects(signal), [])
  const catalog = useApiResource(loadProjects, keys.catalog)
  usePageTitle('Việc của tôi', 'TaskFlow')
  const projects = catalog.data || []
  const requested = fixedProjectId || params.get('projectId') || 'all'
  const project =
    requested === 'all'
      ? { id: 'all', name: 'Tất cả dự án', status: 'ACTIVE' }
      : projects.find((item) => item.id === requested)
  function selectProject(id) {
    if (fixedProjectId)
      navigate(
        id === 'all' ? '/tasks' : `/projects/${encodeURIComponent(id)}/tasks`,
      )
    else setParams({ projectId: id }, { replace: true })
  }
  return (
    <div className="tasks-page">
      <Link className="project-back" to="/projects">
        ← Về dự án của tôi
      </Link>
      <TaskState resource={catalog}>
        {!projects.length ? (
          <div className="task-state">
            <h1>Công việc của tôi</h1>
            <p>Bạn cần tạo dự án trước khi thêm công việc.</p>
            <Link className="project-button-primary" to="/projects">
              Đến trang dự án
            </Link>
          </div>
        ) : !project ? (
          <div className="task-state" role="alert">
            <h1>Không tìm thấy dự án</h1>
            <p>Dự án không tồn tại hoặc bạn không có quyền truy cập.</p>
            <Link to="/tasks">Chọn lại dự án</Link>
          </div>
        ) : (
          <TaskScope
            key={project.id}
            project={project}
            projects={projects}
            selectProject={selectProject}
            refreshProjects={catalog.retry}
          />
        )}
      </TaskState>
    </div>
  )
}
