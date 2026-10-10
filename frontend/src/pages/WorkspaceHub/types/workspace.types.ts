export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Workspace {
  _id: string
  name: string
  description?: string
  logoUrl?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  role?: WorkspaceRole
  memberCount?: number
  activeTaskCount?: number
}

export interface GetWorkspacesQuery {
  search?: string
  role?: WorkspaceRole
  sortBy?: 'createdAt' | 'name'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

export interface CreateWorkspaceInput {
  name: string
  description?: string
  logoUrl?: string
}

export interface UpdateWorkspaceInput extends Partial<CreateWorkspaceInput> {}
