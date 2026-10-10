import type { MemberRole } from '../../../types/members.types'
import { getRoleColors, getRoleDotColor } from '../../../utils/members.utils'

interface Props {
  role: MemberRole
  memberId: string
  onChange: (memberId: string, role: MemberRole) => void
}

export const RoleBadge = ({ role, memberId, onChange }: Props) => {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm ${getRoleColors(role)}`}>
      <span className={`w-2 h-2 rounded-full ${getRoleDotColor(role)}`}></span>
      <select 
        value={role}
        onChange={(e) => onChange(memberId, e.target.value as MemberRole)}
        className="bg-transparent text-xs font-semibold cursor-pointer focus:outline-none pr-1 appearance-none"
      >
        <option value="OWNER">Owner</option>
        <option value="ADMIN">Admin</option>
        <option value="MEMBER">Member</option>
      </select>
    </div>
  )
}
