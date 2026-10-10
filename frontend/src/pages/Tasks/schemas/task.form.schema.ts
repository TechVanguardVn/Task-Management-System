import { z } from 'zod'
import { TaskStatusEnum, TaskPriorityEnum } from '@/pages/Tasks/schemas/task.schema'

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Tiêu đề không được để trống').max(200, 'Tiêu đề tối đa 200 ký tự').trim(),
  description: z.string().max(2000, 'Mô tả tối đa 2000 ký tự').optional(),
  status: TaskStatusEnum.default('TODO'),
  priority: TaskPriorityEnum.default('MEDIUM'),
  dueDate: z.string().optional(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  workspaceId: z.string().min(1, 'Vui lòng chọn Workspace'),
  assigneeId: z.string().optional(),
})

export const updateTaskSchema = createTaskSchema.partial().extend({
  title: z.string().min(1).max(200).trim().optional(),
})

export const taskFilterSchema = z.object({
  search: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  sortBy: z.enum(['createdAt', 'dueDate', 'priority', 'order']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

export type CreateTaskFormValues = z.infer<typeof createTaskSchema>
export type UpdateTaskFormValues = z.infer<typeof updateTaskSchema>
export type TaskFilterValues = z.infer<typeof taskFilterSchema>
