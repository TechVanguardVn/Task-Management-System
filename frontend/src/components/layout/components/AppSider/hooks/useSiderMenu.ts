import { useLocation, useNavigate } from 'react-router-dom'
import type { MenuProps } from 'antd'
import React from 'react'
import { Kanban, Users } from 'lucide-react'
import { LayoutDashboard, ListTodo } from 'lucide-react'
import { MENU_KEYS, MENU_LABELS } from '../constants/menu.constants'

export const useSiderMenu = () => {
  const location = useLocation()
  const navigate = useNavigate()
  
  const sortedKeys = Object.values(MENU_KEYS).sort((a, b) => b.length - a.length)
  
  let activeKey = MENU_KEYS.DASHBOARD as string
  if (location.pathname.startsWith('/workspaces')) {
    activeKey = MENU_KEYS.WORKSPACE
  } else {
    const found = sortedKeys.find(key => location.pathname.startsWith(key))
    if (found) activeKey = found
  }

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key)
  }

  const menuItems: MenuProps['items'] = [
    {
      key: MENU_KEYS.DASHBOARD,
      icon: React.createElement(LayoutDashboard, { size: 18 }),
      label: MENU_LABELS[MENU_KEYS.DASHBOARD],
    },
    {
      key: MENU_KEYS.TASK_LIST,
      icon: React.createElement(ListTodo, { size: 18 }),
      label: MENU_LABELS[MENU_KEYS.TASK_LIST],
    },
    {
      key: MENU_KEYS.KANBAN_BOARD,
      icon: React.createElement(Kanban, { size: 18 }),
      label: MENU_LABELS[MENU_KEYS.KANBAN_BOARD],
    },
    {
      key: MENU_KEYS.WORKSPACE,
      icon: React.createElement(Users, { size: 18 }),
      label: MENU_LABELS[MENU_KEYS.WORKSPACE],
    },
  ]

  return {
    selectedKey: activeKey,
    menuItems,
    handleMenuClick,
  }
}
