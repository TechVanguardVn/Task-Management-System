import axios from "axios";

import { apiClient } from "../lib/api-client";
import { normalizeApiError } from "../lib/api-errors";
import type { DashboardStatsResponse } from "../types/dashboard";

export async function getDashboardStats(
  signal?: AbortSignal,
): Promise<DashboardStatsResponse> {
  try {
    const response = await apiClient.get<DashboardStatsResponse>(
      "/dashboard/stats",
      { signal },
    );

    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error;
    }

    throw normalizeApiError(error);
  }
}
