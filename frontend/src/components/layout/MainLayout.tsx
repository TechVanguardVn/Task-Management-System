import { useState, useEffect } from 'react'
import { Layout } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { AppSider } from './components/AppSider/AppSider'
import { AppHeader } from './components/AppHeader/AppHeader'
import { AppBreadcrumb } from './components/AppBreadcrumb/AppBreadcrumb'

const { Content } = Layout

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <Layout key={location.key} style={{ minHeight: '100vh' }}>
      <AppSider collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <Layout className="transition-all w-full overflow-x-hidden duration-300 bg-[#faf8ff]">
        <AppHeader />
        <Content className={`relative transition-all duration-300 w-full min-h-screen bg-transparent`}>
          <div className={`max-w-7xl mx-auto w-full p-6 lg:p-8`}>
            <AppBreadcrumb />
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
