import { z } from "zod";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const projectFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Project name is required.")
      .max(120, "Project name must be at most 120 characters."),
    description: z
      .string()
      .trim()
      .max(2000, "Description must be at most 2000 characters."),
    color: z
      .string()
      .trim()
      .refine((val) => HEX_COLOR_REGEX.test(val), "Invalid hex color code."),
    status: z.enum(["ACTIVE", "ARCHIVED"]),
    startDate: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || DATE_ONLY_REGEX.test(val),
        "Invalid start date.",
      ),
    dueDate: z
      .string()
      .trim()
      .refine(
        (val) => val === "" || DATE_ONLY_REGEX.test(val),
        "Invalid due date.",
      ),
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

export type ProjectFormValues = z.infer<typeof projectFormSchema>;
