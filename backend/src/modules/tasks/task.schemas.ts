import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

const statusEnum = z.nativeEnum(TaskStatus, {
  errorMap: () => ({ message: 'Trạng thái phải là TODO, IN_PROGRESS hoặc DONE' }),
});
const priorityEnum = z.nativeEnum(TaskPriority, {
  errorMap: () => ({ message: 'Mức ưu tiên phải là LOW, MEDIUM hoặc HIGH' }),
});

const dueDate = z.preprocess(
  (v) => (v === '' ? null : v),
  z.union([z.null(), z.coerce.date({ errorMap: () => ({ message: 'Hạn hoàn thành không hợp lệ (ISO 8601)' }) })]),
);

const tags = z
  .array(z.string().trim().min(1).max(30, 'Mỗi tag tối đa 30 ký tự'))
  .max(10, 'Tối đa 10 tag')
  .transform((arr) => [...new Set(arr.map((t) => t.toLowerCase()))]);

const taskFields = {
  title: z
    .string({ required_error: 'Tiêu đề là bắt buộc' })
    .trim()
    .min(1, 'Tiêu đề không được để trống')
    .max(200, 'Tiêu đề tối đa 200 ký tự'),
  description: z.string().trim().max(5000, 'Mô tả tối đa 5000 ký tự').nullable(),
  status: statusEnum,
  priority: priorityEnum,
  dueDate,
  tags,
};

export const createTaskSchema = z.object({
  title: taskFields.title,
  description: taskFields.description.optional(),
  status: taskFields.status.default(TaskStatus.TODO),
  priority: taskFields.priority.default(TaskPriority.MEDIUM),
  dueDate: taskFields.dueDate.optional(),
  tags: taskFields.tags.default([]),
});

export const updateTaskSchema = z
  .object(taskFields)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Cần ít nhất một trường để cập nhật');

/**
 * Chỉ định vị trí mới theo 1 trong 2 cách:
 *  - position: chỉ số trong cột đích (0 = trên cùng)
 *  - afterId : đặt ngay sau task này (null = trên cùng) — dùng khi board đang lọc,
 *              vì chỉ số hiển thị không trùng với chỉ số thật trong cột
 */
export const moveTaskSchema = z
  .object({
    status: statusEnum,
    position: z.coerce.number().int().min(0).optional(),
    afterId: z.string().uuid().nullable().optional(),
  })
  .refine((v) => v.position !== undefined || v.afterId !== undefined, {
    message: 'Cần truyền position hoặc afterId',
    path: ['position'],
  });

/** Cho phép truyền 1 giá trị hoặc danh sách phân tách bằng dấu phẩy: ?status=TODO,DONE */
const csvEnum = <T extends z.ZodTypeAny>(schema: T) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined))
    .pipe(z.array(schema).optional());

export const listTasksQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  status: csvEnum(statusEnum),
  priority: csvEnum(priorityEnum),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const boardQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  priority: csvEnum(priorityEnum),
});

export const idParamSchema = z.object({ id: z.string().uuid('ID không hợp lệ') });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type BoardQuery = z.infer<typeof boardQuerySchema>;
