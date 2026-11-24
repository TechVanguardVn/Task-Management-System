import { useCallback, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Sidebar } from '../components/layout/Sidebar.jsx'
import { Header } from '../components/layout/Header.jsx'
import { MobileNavigation } from '../components/layout/MobileNavigation.jsx'
import { pageContext } from '../components/layout/navigation.js'
import '../components/layout/workspace.css'

export function AppLayout() {
  const [navigationOpen, setNavigationOpen] = useState(false)
  const closeNavigation = useCallback(() => setNavigationOpen(false), [])
  const { pathname } = useLocation()
  useEffect(() => {
    const previousLanguage = document.documentElement.lang
    document.documentElement.lang = 'vi'
    document.title = `${pageContext(pathname)} | TaskFlow`
    return () => {
      document.documentElement.lang = previousLanguage
    }
  }, [pathname])

  return (
    <div className="workspace-shell">
      <a href="#main-content" className="workspace-skip">
        Chuyển đến nội dung
      </a>
      <aside className="workspace-sidebar">
        <Sidebar />
      </aside>
      <div className="workspace-body">
        <Header
          navigationOpen={navigationOpen}
          onOpenNavigation={() => setNavigationOpen(true)}
        />
        <main id="main-content" tabIndex={-1} className="workspace-main">
          <Outlet />
        </main>
      </div>
      <MobileNavigation open={navigationOpen} onClose={closeNavigation} />
    </div>
  )
}
