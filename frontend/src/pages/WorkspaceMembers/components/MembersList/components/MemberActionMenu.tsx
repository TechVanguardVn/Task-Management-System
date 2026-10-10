import { Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import { Eye, Shield, UserMinus, MoreHorizontal } from 'lucide-react'

import { useNavigate } from 'react-router-dom'

interface Props {
  memberId: string
  onRemove: (memberId: string) => void
  onChangeRole: (memberId: string) => void
  currentUserRole?: string
  workspaceId: string
}

export const MemberActionMenu = ({ memberId, onRemove, onChangeRole, currentUserRole, workspaceId }: Props) => {
  const navigate = useNavigate()
  const canDispatch = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'
  const items: MenuProps['items'] = [
    ...(canDispatch ? [{ 
      key: 'view', 
      icon: <Eye size={16} />, 
      label: 'View Activity',
      onClick: () => navigate(`/task-list?workspaceId=${workspaceId}&openDispatch=true`)
    }] : []),
    { key: 'role', icon: <Shield size={16} />, label: 'Change Role', onClick: () => onChangeRole(memberId) },
    { type: 'divider' },
    {
      key: 'remove',
      icon: <UserMinus size={16} />,
      label: 'Remove Member',
      danger: true,
      onClick: () => onRemove(memberId)
    },
  ]

  return (
    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight" overlayClassName="glass-dropdown">
      <button className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer">
        <MoreHorizontal size={20} />
      </button>
    </Dropdown>
  )
}
