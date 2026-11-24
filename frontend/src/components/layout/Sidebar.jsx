import { Link, NavLink } from 'react-router'
import { Icon } from '../Icon.jsx'
import { navigation } from './navigation.js'

export function Sidebar({ onNavigate, mobile = false }) {
  return (
    <div className="workspace-sidebar-content">
      <div className="workspace-brand-row">
        <Link
          to="/dashboard"
          className="workspace-brand"
          onClick={onNavigate}
          aria-label="TaskFlow — Tổng quan"
        >
          <span className="workspace-brand-mark">
            <Icon name="dashboard" />
          </span>
          <span>
            TaskFlow
            <span className="workspace-brand-caption">Không gian làm việc</span>
          </span>
        </Link>
        {mobile && (
          <button
            type="button"
            className="shell-icon-button"
            onClick={onNavigate}
            aria-label="Đóng điều hướng"
          >
            <Icon name="close" />
          </button>
        )}
      </div>
      <p className="workspace-nav-label">Không gian cá nhân</p>
      <nav aria-label="Điều hướng chính">
        {navigation.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `workspace-nav-link${isActive ? ' is-active' : ''}`
            }
          >
            <Icon name={icon} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="workspace-sidebar-footer">
        <span className="workspace-footer-mark" aria-hidden="true" />
        <span>TaskFlow</span>
      </div>
    </div>
  )
}
