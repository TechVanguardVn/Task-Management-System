import { Avatar } from 'antd'
import { getAvatarUrl } from '../../utils/dispatch.utils'

interface MemberAvatarProps {
  name: string
  avatarUrl?: string
}

export const MemberAvatar = ({ name, avatarUrl }: MemberAvatarProps) => {
  return (
    <div className="relative">
      <Avatar 
        src={getAvatarUrl(name, avatarUrl)}
        alt={name}
        size={40}
        className="ring-2 ring-white shadow-sm"
      />
      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
    </div>
  )
}
