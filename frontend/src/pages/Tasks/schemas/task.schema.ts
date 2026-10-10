import { z } from 'zod'

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE'])
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: TaskStatusEnum.default('TODO'),
  priority: TaskPriorityEnum.default('MEDIUM'),
  dueDate: z.string().optional(),
  tags: z.array(z.string()).max(10, 'Max 10 tags allowed').optional().default([]),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
