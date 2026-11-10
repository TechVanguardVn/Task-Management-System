import { StrictMode } from "react";
import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../lib/api-errors";
import { getDashboardStats } from "../services/dashboard-api";
import type { DashboardStatsResponse } from "../types/dashboard";
import { useDashboardStats } from "./useDashboardStats";

vi.mock("../services/dashboard-api", () => ({
  getDashboardStats: vi.fn(),
}));

const mockedGetDashboardStats = vi.mocked(getDashboardStats);

const STATS: DashboardStatsResponse = {
  total_tasks: 6,
  completed_tasks: 1,
  in_progress_tasks: 3,
  todo_tasks: 2,
  upcoming_deadlines: [],
};

const NEWER_STATS: DashboardStatsResponse = {
  ...STATS,
  total_tasks: 7,
  completed_tasks: 2,
};

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
}

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, resolve, reject };
}

function StrictWrapper({ children }: { children: ReactNode }) {
  return <StrictMode>{children}</StrictMode>;
}

describe("useDashboardStats", () => {
  beforeEach(() => {
    mockedGetDashboardStats.mockReset();
  });

  it("fetches on mount and exposes the latest data", async () => {
    mockedGetDashboardStats.mockResolvedValue(STATS);

    const { result } = renderHook(() => useDashboardStats());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(STATS);
    expect(result.current.error).toBeNull();
    expect(mockedGetDashboardStats).toHaveBeenCalledTimes(1);
    expect(mockedGetDashboardStats.mock.calls[0]?.[0]).toBeInstanceOf(
      AbortSignal,
    );
  });

  it("retries after a failed request", async () => {
    mockedGetDashboardStats
      .mockRejectedValueOnce(
        new ApiError(
          "Unable to reach the server. Check your connection and try again.",
          { isNetworkError: true },
        ),
      )
      .mockResolvedValueOnce(STATS);

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() =>
      expect(result.current.error).toMatchObject({
        isNetworkError: true,
      }),
    );
    expect(result.current.isLoading).toBe(false);

    act(() => result.current.refetch());

    await waitFor(() => expect(result.current.data).toEqual(STATS));

    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(mockedGetDashboardStats).toHaveBeenCalledTimes(2);
  });

  it("does not let a stale request overwrite newer data", async () => {
    const firstRequest = createDeferred<DashboardStatsResponse>();
    const secondRequest = createDeferred<DashboardStatsResponse>();

    mockedGetDashboardStats
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result } = renderHook(() => useDashboardStats());

    await waitFor(() =>
      expect(mockedGetDashboardStats).toHaveBeenCalledTimes(1),
    );

    act(() => result.current.refetch());

    await waitFor(() =>
      expect(mockedGetDashboardStats).toHaveBeenCalledTimes(2),
    );

    const firstSignal = mockedGetDashboardStats.mock.calls[0]?.[0];
    expect(firstSignal?.aborted).toBe(true);

    await act(async () => {
      secondRequest.resolve(NEWER_STATS);
      await secondRequest.promise;
    });

    await waitFor(() => expect(result.current.data).toEqual(NEWER_STATS));

    await act(async () => {
      firstRequest.resolve(STATS);
      await firstRequest.promise;
    });

    expect(result.current.data).toEqual(NEWER_STATS);
  });

  it("aborts an outstanding request on unmount", async () => {
    const request = createDeferred<DashboardStatsResponse>();
    mockedGetDashboardStats.mockReturnValue(request.promise);

    const { unmount } = renderHook(() => useDashboardStats());

    await waitFor(() =>
      expect(mockedGetDashboardStats).toHaveBeenCalledTimes(1),
    );

    const signal = mockedGetDashboardStats.mock.calls[0]?.[0];

    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("allows a fresh request after a cancelled setup", async () => {
    const firstRequest = createDeferred<DashboardStatsResponse>();

    mockedGetDashboardStats
      .mockReturnValueOnce(firstRequest.promise)
      .mockResolvedValueOnce(STATS);

    const firstRender = renderHook(() => useDashboardStats(), {
      wrapper: StrictWrapper,
    });

    await waitFor(() =>
      expect(mockedGetDashboardStats).toHaveBeenCalledTimes(1),
    );

    const firstSignal = mockedGetDashboardStats.mock.calls[0]?.[0];

    expect(firstSignal?.aborted).toBe(false);

    firstRender.unmount();

    expect(firstSignal?.aborted).toBe(true);

    const secondRender = renderHook(() => useDashboardStats(), {
      wrapper: StrictWrapper,
    });

    await waitFor(() =>
      expect(mockedGetDashboardStats).toHaveBeenCalledTimes(2),
    );

    const secondSignal = mockedGetDashboardStats.mock.calls[1]?.[0];

    expect(secondSignal?.aborted).toBe(false);

    await waitFor(() =>
      expect(secondRender.result.current.data).toEqual(STATS),
    );
    expect(secondRender.result.current.isLoading).toBe(false);
    expect(secondRender.result.current.error).toBeNull();
  });
});
