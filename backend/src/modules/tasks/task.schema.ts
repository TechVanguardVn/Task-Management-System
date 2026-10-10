import { z } from 'zod'

export const TaskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE'])
export const TaskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export type TaskStatus = z.infer<typeof TaskStatusEnum>
export type TaskPriority = z.infer<typeof TaskPriorityEnum>

const SortOrderEnum = z.enum(['asc', 'desc']).default('desc')
const SortByEnum = z.enum(['createdAt', 'dueDate', 'priority', 'order']).default('createdAt')

export const createTaskSchema = z.object({
  body: z.object({
    workspaceId: z.string(),
    assigneeId: z.string().nullable().optional(),
    title: z.string().min(1).max(200).trim(),
    description: z.string().max(2000).optional(),
    status: TaskStatusEnum.default('TODO'),
    priority: TaskPriorityEnum.default('MEDIUM'),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string().max(50)).max(10).default([]),
  }),
})

export const updateTaskSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    assigneeId: z.string().nullable().optional(),
    title: z.string().min(1).max(200).trim().optional(),
    description: z.string().max(2000).optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    dueDate: z.string().datetime().optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
  }),
})

export const updateTaskStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: TaskStatusEnum }),
})

export const reorderTasksSchema = z.object({
  body: z.object({
    taskOrders: z
      .array(
        z.object({
          id: z.string(),
          order: z.number().int().nonnegative(),
          status: TaskStatusEnum,
        })
      )
      .min(1)
      .max(500),
  }),
})

export const getTasksQuerySchema = z.object({
  query: z.object({
    workspaceId: z.string().optional(),
    assigneeId: z.string().optional(),
    status: TaskStatusEnum.optional(),
    priority: TaskPriorityEnum.optional(),
    search: z.string().max(200).optional(),
    tags: z.string().optional(),
    sortBy: SortByEnum,
    sortOrder: SortOrderEnum,
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>['body']
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body']
export type GetTasksQuery = z.infer<typeof getTasksQuerySchema>['query']
