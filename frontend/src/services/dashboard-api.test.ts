import { AxiosError, CanceledError } from "axios";
import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../lib/api-client";
import type { DashboardStatsResponse } from "../types/dashboard";
import { getDashboardStats } from "./dashboard-api";

vi.mock("../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);

const STATS: DashboardStatsResponse = {
  total_tasks: 6,
  completed_tasks: 1,
  in_progress_tasks: 3,
  todo_tasks: 2,
  upcoming_deadlines: [
    {
      id: 105,
      title: "Nộp báo cáo thử việc",
      status: "IN_PROGRESS",
      priority: "HIGH",
      due_date: "2026-11-20T09:00:00Z",
    },
  ],
};

describe("dashboard API", () => {
  beforeEach(() => {
    mockedGet.mockReset();
  });

  it("returns dashboard statistics", async () => {
    mockedGet.mockResolvedValue({
      data: STATS,
    } as AxiosResponse<DashboardStatsResponse>);

    await expect(getDashboardStats()).resolves.toEqual(STATS);
  });

  it("calls the dashboard stats endpoint and forwards the abort signal", async () => {
    mockedGet.mockResolvedValue({
      data: STATS,
    } as AxiosResponse<DashboardStatsResponse>);

    const controller = new AbortController();

    await getDashboardStats(controller.signal);

    expect(mockedGet).toHaveBeenCalledWith("/dashboard/stats", {
      signal: controller.signal,
    });
  });

  it("normalizes network failures without exposing raw errors", async () => {
    mockedGet.mockRejectedValue(
      new AxiosError("Network Error", AxiosError.ERR_NETWORK),
    );

    await expect(getDashboardStats()).rejects.toMatchObject({
      name: "ApiError",
      status: null,
      isNetworkError: true,
      message:
        "Unable to reach the server. Check your connection and try again.",
    });
  });

  it("preserves cancellation errors for the caller", async () => {
    const cancellation = new CanceledError("Request aborted");
    mockedGet.mockRejectedValue(cancellation);

    await expect(getDashboardStats()).rejects.toBe(cancellation);
  });
});
