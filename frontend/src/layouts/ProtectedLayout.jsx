import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth.js'

export function ProtectedLayout() {
  const { status, user, retryUser, clearAccessToken } = useAuth()
  if (status === 'anonymous') return <Navigate to="/login" replace />
  if (status === 'error')
    return (
      <main className="session-gate" lang="vi">
        <h1>Chưa thể tải thông tin tài khoản</h1>
        <p>Vui lòng kiểm tra kết nối và thử lại.</p>
        <div>
          <button onClick={retryUser}>Thử lại</button>
          <button onClick={clearAccessToken}>Về trang đăng nhập</button>
        </div>
      </main>
    )
  if (!user)
    return (
      <main className="session-gate" lang="vi" role="status">
        <span className="session-spinner" aria-hidden="true" />
        <p>Đang xác thực phiên đăng nhập…</p>
      </main>
    )
  return <Outlet />
}
