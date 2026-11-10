import { z } from "zod";
import { isValidUuid } from "../projects/projects.schema";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidCalendarDate(value: string): boolean {
  if (!DATE_ONLY_REGEX.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

const optionalDateStringSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null) {
      return val;
    }
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine(
    (val) => val === undefined || val === null || isValidCalendarDate(val),
    "Due date must be a valid calendar date in YYYY-MM-DD format.",
  );

const optionalTaskDescriptionSchema = z
  .union([z.string(), z.null()])
  .optional()
  .transform((val) => {
    if (val === undefined || val === null) {
      return val;
    }
    const trimmed = val.trim();
    return trimmed === "" ? null : trimmed;
  })
  .refine(
    (val) => val === undefined || val === null || val.length <= 4000,
    "Task description must be at most 4000 characters.",
  );

export const listTasksQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(200, "Search query must be at most 200 characters.")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "dueDate", "priority", "title"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce
    .number()
    .int("Page must be an integer.")
    .min(1, "Page must be at least 1.")
    .optional()
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer.")
    .min(1, "Limit must be at least 1.")
    .max(100, "Limit must be at most 100.")
    .optional()
    .default(10),
});

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title is required.")
      .max(200, "Task title must be at most 200 characters."),
    description: optionalTaskDescriptionSchema,
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional().default("TODO"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional().default("MEDIUM"),
    dueDate: optionalDateStringSchema,
  })
  .strict();

export const updateTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title cannot be empty.")
      .max(200, "Task title must be at most 200 characters.")
      .optional(),
    description: optionalTaskDescriptionSchema,
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
    dueDate: optionalDateStringSchema,
  })
  .strict()
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.dueDate !== undefined,
    {
      message: "At least one field must be provided to update the task.",
    },
  );

export { isValidUuid };
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
