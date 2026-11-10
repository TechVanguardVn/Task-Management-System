import { z } from "zod";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

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
    "Date must be a valid calendar date in YYYY-MM-DD format.",
  );

const optionalDescriptionSchema = z
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
    (val) => val === undefined || val === null || val.length <= 2000,
    "Description must be at most 2000 characters.",
  );

const optionalColorSchema = z
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
    (val) => val === undefined || val === null || HEX_COLOR_REGEX.test(val),
    "Color must be a valid hex color code (e.g. #2563eb).",
  );

export const listProjectsQuerySchema = z.object({
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  search: z
    .string()
    .trim()
    .max(120, "Search query must be at most 120 characters.")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : undefined)),
  sortBy: z.enum(["updatedAt", "createdAt", "name", "dueDate"]).optional().default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const createProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required.")
      .max(120, "Project name must be at most 120 characters."),
    description: optionalDescriptionSchema,
    color: optionalColorSchema,
    startDate: optionalDateStringSchema,
    dueDate: optionalDateStringSchema,
  })
  .refine(
    (data) => {
      if (data.startDate && data.dueDate) {
        return data.dueDate >= data.startDate;
      }
      return true;
    },
    {
      message: "Due date must be on or after the start date.",
      path: ["dueDate"],
    },
  );

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name cannot be empty.")
      .max(120, "Project name must be at most 120 characters.")
      .optional(),
    description: optionalDescriptionSchema,
    color: optionalColorSchema,
    status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
    startDate: optionalDateStringSchema,
    dueDate: optionalDateStringSchema,
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined ||
      data.color !== undefined ||
      data.status !== undefined ||
      data.startDate !== undefined ||
      data.dueDate !== undefined,
    {
      message: "At least one field must be provided to update the project.",
    },
  );

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
