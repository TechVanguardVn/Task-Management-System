import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(100, 'Max 100 characters').trim(),
  description: z.string().max(500, 'Max 500 characters').optional(),
  logoUrl: z.string().optional()
})

export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>
