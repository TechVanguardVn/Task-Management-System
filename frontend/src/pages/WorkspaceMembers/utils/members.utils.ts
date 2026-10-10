import type { WorkspaceMember, MemberRole } from '../types/members.types'

export const getRoleColors = (role: MemberRole) => {
  switch (role) {
    case 'OWNER':
      return 'bg-amber-50/90 text-amber-600 shadow-amber-500/20'
    case 'ADMIN':
      return 'bg-rose-50/90 text-rose-600 shadow-rose-500/20'
    case 'MEMBER':
      return 'bg-indigo-50/90 text-indigo-600 shadow-indigo-500/20'
    default:
      return 'bg-slate-100/90 text-slate-600 shadow-slate-500/20'
  }
}

export const getRoleDotColor = (role: MemberRole) => {
  switch (role) {
    case 'OWNER': return 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]'
    case 'ADMIN': return 'bg-rose-500 shadow-[0_0_6px_rgba(225,29,72,0.4)]'
    case 'MEMBER': return 'bg-indigo-500 shadow-[0_0_6px_rgba(79,70,229,0.4)]'
    default: return 'bg-slate-400'
  }
}

export const getStatusDotColor = (status: WorkspaceMember['status']) => {
  switch (status) {
    case 'online': return 'bg-emerald-500 shadow-[0_0_8px_rgba(5,150,105,0.6)]'
    case 'idle': return 'bg-amber-500 shadow-[0_0_8px_rgba(217,119,6,0.6)]'
    case 'offline': return 'bg-slate-300'
  }
}
