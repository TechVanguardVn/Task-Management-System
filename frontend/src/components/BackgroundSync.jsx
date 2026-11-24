export function BackgroundSync({ resource }) {
  if (resource.status !== 'success') return null
  if (resource.backgroundError)
    return (
      <p className="project-error" role="alert">
        Chưa thể đồng bộ dữ liệu mới.{' '}
        <button onClick={resource.retry}>Thử lại</button>
      </p>
    )
  if (resource.isFetching)
    return (
      <p className="kanban-loaded-count" role="status">
        Đang đồng bộ nền…
      </p>
    )
  return null
}
