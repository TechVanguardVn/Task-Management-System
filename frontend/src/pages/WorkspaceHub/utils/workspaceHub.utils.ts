import type { WorkspaceRole } from '../types/workspaceHub.types'

export const getRoleColors = (role: WorkspaceRole) => {
  switch (role) {
    case 'OWNER':
      return 'bg-indigo-100 text-indigo-700'
    case 'ADMIN':
      return 'bg-rose-100 text-rose-700'
    case 'MEMBER':
      return 'bg-slate-100 text-slate-700'
    case 'GUEST':
      return 'bg-gray-100 text-gray-600'
  }
}

export const getWorkspaceIconColors = (index: number) => {
  const colors = [
    'from-indigo-600 via-indigo-500 to-violet-600 text-white shadow-[0_4px_12px_rgba(79,70,229,0.25)]',
    'from-sky-600 via-sky-500 to-blue-500 text-white shadow-[0_4px_12px_rgba(2,132,199,0.22)]',
    'from-violet-600 via-fuchsia-500 to-pink-500 text-white shadow-[0_4px_12px_rgba(124,58,237,0.22)]',
  ]
  return colors[index % colors.length]
}
