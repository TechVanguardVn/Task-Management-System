import { useLocation } from 'react-router'
import { Icon } from '../Icon.jsx'
import { pageContext } from './navigation.js'
import { UserMenu } from './UserMenu.jsx'

export function Header({ onOpenNavigation, navigationOpen }) {
  const { pathname } = useLocation()
  return (
    <header className="workspace-header">
      <div className="workspace-header-context">
        <button
          type="button"
          className="shell-icon-button mobile-nav-toggle"
          onClick={onOpenNavigation}
          aria-label="Mở điều hướng"
          aria-haspopup="dialog"
          aria-expanded={navigationOpen}
          aria-controls="mobile-navigation"
        >
          <Icon name="menu" />
        </button>
        <span>{pageContext(pathname)}</span>
      </div>
      <UserMenu />
    </header>
  )
}
