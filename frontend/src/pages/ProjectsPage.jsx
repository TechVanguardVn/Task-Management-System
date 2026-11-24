import { keys } from '../query/keys.js'
import { BackgroundSync } from '../components/BackgroundSync.jsx'
import { useCallback, useMemo, useState } from 'react'
import { projectsApi } from '../api/projects.js'
import { useApiResource } from '../hooks/useApiResource.js'
import { usePageTitle } from '../hooks/usePageTitle.js'
import { ProjectCard } from '../components/projects/ProjectCard.jsx'
import { ProjectEditor } from '../components/projects/ProjectEditor.jsx'
import { ProjectConfirmation } from '../components/projects/ProjectConfirmation.jsx'
import {
  projectError,
  visibleProjects,
} from '../components/projects/projectModel.js'
import '../components/projects/projects.css'

export function ProjectsPage() {
  usePageTitle('Dự án của tôi', 'TaskFlow')
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('ALL')
  const [sort, setSort] = useState('createdAt:desc')
  const [dialog, setDialog] = useState(null)
  const load = useCallback((signal) => projectsApi.list(page, signal), [page])
  const resource = useApiResource(load, keys.projects(page))
  const projects = useMemo(
    () => visibleProjects(resource.data?.content || [], search, status, sort),
    [resource.data, search, status, sort],
  )
  const ready = resource.status === 'success'

  function open(action, project) {
    setDialog({ action, project })
  }
  function saved() {
    const deletingLast =
      dialog.action === 'delete' && resource.data?.content.length === 1
    setDialog(null)
    if (deletingLast && page > 0) setPage(page - 1)
  }

  return (
    <div className="projects-page">
      <BackgroundSync resource={resource} />
      <header className="projects-heading">
        <div>
          <span className="projects-eyebrow">Không gian cá nhân</span>
          <h1>
            Dự án của tôi{' '}
            {ready && (
              <span className="projects-total">
                {resource.data.totalElements.toLocaleString('vi-VN')} dự án
              </span>
            )}
          </h1>
          <p>Quản lý và theo dõi các dự án cá nhân của bạn.</p>
        </div>
        <button
          type="button"
          className="project-button-primary"
          onClick={() => open('create')}
        >
          ＋ Tạo dự án mới
        </button>
      </header>
      <section
        className="projects-controls"
        aria-label="Tìm kiếm và bộ lọc dự án"
      >
        <div className="projects-search">
          <label htmlFor="project-search">Tìm theo tên trên trang này</label>
          <input
            id="project-search"
            type="search"
            placeholder="Nhập tên dự án…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="projects-filter">
          <label htmlFor="project-status-filter">Trạng thái</label>
          <select
            id="project-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="ARCHIVED">Đã lưu trữ</option>
          </select>
        </div>
        <div className="projects-filter">
          <label htmlFor="project-sort">Sắp xếp trên trang này</label>
          <select
            id="project-sort"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="createdAt:desc">Ngày tạo: mới nhất</option>
            <option value="createdAt:asc">Ngày tạo: cũ nhất</option>
            <option value="updatedAt:desc">Cập nhật gần nhất</option>
            <option value="startDate:asc">Ngày bắt đầu: sớm nhất</option>
            <option value="dueDate:asc">Hạn hoàn thành: sớm nhất</option>
          </select>
        </div>
        <p>
          Tìm kiếm, lọc và sắp xếp chỉ áp dụng cho các dự án đã tải trên trang
          hiện tại. Chuyển trang để xem các dự án khác.
        </p>
      </section>
      {resource.status === 'loading' && (
        <div
          className="projects-grid"
          role="status"
          aria-label="Đang tải dự án"
        >
          {[0, 1, 2].map((item) => (
            <div className="project-skeleton" key={item}>
              <span />
              <span />
              <span />
            </div>
          ))}
        </div>
      )}
      {resource.status === 'error' && (
        <div className="project-empty" role="alert">
          <p>{projectError(resource.error)}</p>
          <button className="project-button-secondary" onClick={resource.retry}>
            Thử lại
          </button>
        </div>
      )}
      {ready &&
        (projects.length ? (
          <div className="projects-grid">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} onAction={open} />
            ))}
          </div>
        ) : (
          <div className="project-empty">
            <h2>
              {resource.data.totalElements === 0
                ? 'Bạn chưa có dự án nào.'
                : resource.data.content.length === 0
                  ? 'Trang này không còn dự án.'
                  : 'Không có dự án phù hợp trên trang này.'}
            </h2>
            {resource.data.totalElements === 0 ? (
              <button
                className="project-button-primary"
                onClick={() => open('create')}
              >
                Tạo dự án
              </button>
            ) : (
              <button
                className="project-button-secondary"
                onClick={() => {
                  setSearch('')
                  setStatus('ALL')
                  if (!resource.data.content.length) setPage(0)
                }}
              >
                {' '}
                {resource.data.content.length ? 'Bỏ bộ lọc' : 'Về trang đầu'}
              </button>
            )}
          </div>
        ))}
      {ready && (
        <nav className="projects-pagination" aria-label="Phân trang dự án">
          <span>
            Trang {page + 1} · Đã tải {resource.data.content.length} dự án ·
            Hiển thị {projects.length}
          </span>
          <div>
            <button
              className="project-button-secondary"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Trước
            </button>
            <button
              className="project-button-secondary"
              disabled={page + 1 >= resource.data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Sau
            </button>
          </div>
        </nav>
      )}
      {dialog &&
        (dialog.action === 'create' || dialog.action === 'edit' ? (
          <ProjectEditor
            key={dialog.project?.id || 'new'}
            project={dialog.project}
            onClose={() => setDialog(null)}
            onSuccess={saved}
          />
        ) : (
          <ProjectConfirmation
            project={dialog.project}
            action={dialog.action}
            onClose={() => setDialog(null)}
            onSuccess={saved}
          />
        ))}
    </div>
  )
}
