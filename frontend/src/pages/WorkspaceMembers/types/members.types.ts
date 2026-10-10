export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface WorkspaceMember {
  id: string
  fullName: string
  email: string
  role: MemberRole
  avatarUrl?: string
  initials?: string
  joinedAt: string
  status: 'online' | 'offline' | 'idle'
  isCurrentUser?: boolean
}
