import { z } from "zod";

export const upcomingTasksQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int("Limit must be an integer.")
    .min(1, "Limit must be at least 1.")
    .max(50, "Limit must be at most 50.")
    .optional()
    .default(8),
});

export type UpcomingTasksQuery = z.infer<typeof upcomingTasksQuerySchema>;
