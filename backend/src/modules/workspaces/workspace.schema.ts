import { z } from 'zod'

export const WorkspaceRoleEnum = z.enum(['OWNER', 'ADMIN', 'MEMBER'])
export type WorkspaceRole = z.infer<typeof WorkspaceRoleEnum>

const SortOrderEnum = z.enum(['asc', 'desc']).default('desc')
const SortByEnum = z.enum(['createdAt', 'name']).default('createdAt')

export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).trim(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
  }),
})

export const updateWorkspaceSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    name: z.string().min(1).max(100).trim().optional(),
    description: z.string().max(500).optional(),
    logoUrl: z.string().url().optional(),
  }),
})

export const addWorkspaceMemberSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    email: z.string().email(),
    role: WorkspaceRoleEnum.default('MEMBER'),
  }),
})

export const getWorkspacesQuerySchema = z.object({
  query: z.object({
    search: z.string().max(100).optional(),
    role: WorkspaceRoleEnum.optional(),
    sortBy: SortByEnum,
    sortOrder: SortOrderEnum,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
})

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>['body']
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>['body']
export type GetWorkspacesQuery = z.infer<typeof getWorkspacesQuerySchema>['query']
