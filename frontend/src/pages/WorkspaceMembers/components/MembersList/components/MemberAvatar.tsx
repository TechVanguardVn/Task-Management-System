import { Image } from 'antd'
import type { WorkspaceMember } from '../../../types/members.types'
import { getStatusDotColor } from '../../../utils/members.utils'

interface Props {
  member: WorkspaceMember
}

export const MemberAvatar = ({ member }: Props) => {
  return (
    <div className="relative shrink-0">
      <div className="w-11 h-11 rounded-full shadow-sm overflow-hidden flex items-center justify-center bg-slate-100 font-bold tracking-wider text-slate-500">
        {member.avatarUrl ? (
          <Image 
            src={member.avatarUrl} 
            alt={member.fullName} 
            preview={false}
            className="w-full h-full object-cover" 
          />
        ) : (
          member.initials
        )}
      </div>
      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${getStatusDotColor(member.status)}`}></span>
    </div>
  )
}
