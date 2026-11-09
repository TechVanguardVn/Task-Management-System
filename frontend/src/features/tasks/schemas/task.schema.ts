import { z } from "zod";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const taskFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(200, "Task title must be at most 200 characters."),
  description: z
    .string()
    .max(4000, "Description must be at most 4000 characters."),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z
    .string()
    .refine(
      (val) => val === "" || DATE_ONLY_REGEX.test(val),
      "Invalid due date.",
    ),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;
