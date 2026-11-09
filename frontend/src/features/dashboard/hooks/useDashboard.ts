import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardSummary,
  fetchDashboardUpcomingTasks,
} from "../api/dashboard.api";

export const DASHBOARD_QUERY_KEY = ["dashboard"] as const;

export function useDashboardSummary() {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, "summary"] as const,
    queryFn: () => fetchDashboardSummary(),
  });
}

export function useDashboardUpcomingTasks(limit = 8) {
  return useQuery({
    queryKey: [...DASHBOARD_QUERY_KEY, "upcoming-tasks", limit] as const,
    queryFn: () => fetchDashboardUpcomingTasks(limit),
  });
}
