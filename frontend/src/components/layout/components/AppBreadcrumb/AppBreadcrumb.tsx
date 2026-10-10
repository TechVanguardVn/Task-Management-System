import { Breadcrumb } from 'antd'
import { Home } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { MENU_KEYS, MENU_LABELS } from '../AppSider/constants/menu.constants'
export const AppBreadcrumb = () => {
  const location = useLocation()

  const sortedKeys = Object.values(MENU_KEYS).sort((a, b) => b.length - a.length)
  
  let matchedKey = MENU_KEYS.DASHBOARD as string
  if (location.pathname.startsWith('/workspaces')) {
    matchedKey = MENU_KEYS.WORKSPACE
  } else {
    const found = sortedKeys.find(key => location.pathname.startsWith(key))
    if (found) matchedKey = found
  }

  const breadcrumbItems = [
    {
      title: <Link to="/workspaces" className="text-slate-500 hover:text-indigo-600 transition-colors"><Home size={14} className="mb-1 inline-block" /></Link>,
      key: 'home',
    },
  ]

  if (matchedKey) {
    breadcrumbItems.push({
      title: <span className="text-slate-900 font-medium">{MENU_LABELS[matchedKey as keyof typeof MENU_LABELS]}</span>,
      key: matchedKey,
    })
  }

  if (location.pathname.includes('/members')) {
    breadcrumbItems.push({
      title: <span className="text-slate-900 font-medium">Members</span>,
      key: 'members',
    })
  }

  return (
    <div className="mb-4 text-[13px]">
      <Breadcrumb items={breadcrumbItems} className="text-slate-500" separator="›" />
    </div>
  )
}
