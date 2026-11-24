import { BackgroundSync } from '../BackgroundSync.jsx'

export function ResourceState({ resource, children, emptyMessage, onReset }) {
  if (resource.status === 'loading')
    return (
      <div className="dashboard-loading" role="status">
        <span className="dashboard-loading-line" />
        <span>Đang tải dữ liệu…</span>
      </div>
    )
  if (resource.status === 'error')
    return (
      <div className="dashboard-error" role="alert">
        <p>
          {resource.error?.response?.status === 404
            ? 'Không tìm thấy dữ liệu hoặc bạn không có quyền truy cập.'
            : 'Chưa thể tải dữ liệu. Vui lòng kiểm tra kết nối và thử lại.'}
        </p>
        <button type="button" onClick={resource.retry}>
          Thử lại
        </button>
      </div>
    )
  if (emptyMessage && !resource.data.content.length)
    return (
      <div className="dashboard-empty">
        <BackgroundSync resource={resource} />
        <p>{emptyMessage}</p>
        {onReset && (
          <button type="button" className="dashboard-refresh" onClick={onReset}>
            Về trang đầu
          </button>
        )}
      </div>
    )
  return (
    <>
      <BackgroundSync resource={resource} />
      {children}
    </>
  )
}
