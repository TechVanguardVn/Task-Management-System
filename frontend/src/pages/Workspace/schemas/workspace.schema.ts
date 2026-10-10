import { z } from 'zod'

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required').max(50),
})

export type CreateWorkspaceFormValues = z.infer<typeof createWorkspaceSchema>
