import { apiFetch } from "../../../lib/api-client";
import type {
  DashboardSummaryResponse,
  UpcomingTasksResponse,
} from "../../../types/dashboard.types";

export async function fetchDashboardSummary(): Promise<DashboardSummaryResponse> {
  return apiFetch<DashboardSummaryResponse>("/dashboard/summary", {
    method: "GET",
  });
}

export async function fetchDashboardUpcomingTasks(
  limit = 8,
): Promise<UpcomingTasksResponse> {
  const query = new URLSearchParams({ limit: String(limit) });
  return apiFetch<UpcomingTasksResponse>(
    `/dashboard/upcoming-tasks?${query.toString()}`,
    {
      method: "GET",
    },
  );
}
