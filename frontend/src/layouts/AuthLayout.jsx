import { Link, Outlet } from 'react-router'
import { useEffect } from 'react'
import '../components/auth/auth.css'

export function AuthLayout() {
  useEffect(() => {
    const previousLanguage = document.documentElement.lang
    document.documentElement.lang = 'vi'
    return () => {
      document.documentElement.lang = previousLanguage
    }
  }, [])
  return (
    <div className="auth-shell">
      <a className="auth-skip" href="#auth-content">
        Chuyển đến biểu mẫu
      </a>
      <header className="auth-header">
        <Link
          to="/login"
          className="auth-brand"
          aria-label="TaskFlow — Trang đăng nhập"
        >
          <span className="auth-brand-mark" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
            </svg>
          </span>
          TaskFlow
        </Link>
      </header>
      <main id="auth-content" className="auth-main" tabIndex={-1}>
        <section className="auth-panel" aria-labelledby="auth-title">
          <Outlet />
        </section>
      </main>
      <footer className="auth-footer">
        © {new Date().getFullYear()} TaskFlow. Mọi quyền được bảo lưu.
      </footer>
    </div>
  )
}
