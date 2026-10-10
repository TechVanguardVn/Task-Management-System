export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST'

export interface WorkspaceSummary {
  id: string
  name: string
  description?: string
  initials: string
  role: WorkspaceRole
  memberCount: number
  activeProjectsCount: number
}
