import { StrictMode } from "react";
import type { ReactNode } from "react";
import { CanceledError } from "axios";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../lib/api-errors";
import { listTasks } from "../services/tasks-api";
import type {
  PaginatedTasksResponse,
  Task,
} from "../types/task";
import {
  DEFAULT_TASK_PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  useTasks,
} from "./useTasks";

vi.mock("../services/tasks-api", () => ({
  listTasks: vi.fn(),
}));

const mockedListTasks = vi.mocked(listTasks);

const TASK: Task = {
  id: 42,
  user_id: 7,
  title: "Nộp báo cáo thử việc",
  description: "Hoàn thiện báo cáo trước cuối tuần.",
  status: "IN_PROGRESS",
  priority: "HIGH",
  due_date: "2026-11-20T09:00:00Z",
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-05T10:30:00Z",
};

function createPage(
  overrides: Partial<PaginatedTasksResponse> = {},
): PaginatedTasksResponse {
  return {
    items: [TASK],
    total: 1,
    page: 1,
    page_size: DEFAULT_TASK_PAGE_SIZE,
    total_pages: 1,
    ...overrides,
  };
}

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

async function flushPromises(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("useTasks", () => {
  beforeEach(() => {
    mockedListTasks.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches the first page with default pagination on mount", async () => {
    mockedListTasks.mockResolvedValue(createPage());

    const { result } = renderHook(() => useTasks());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedListTasks).toHaveBeenCalledTimes(1);
    expect(mockedListTasks.mock.calls[0]?.[0]).toEqual({
      page: 1,
      page_size: DEFAULT_TASK_PAGE_SIZE,
    });
    expect(mockedListTasks.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    expect(result.current.items).toEqual([TASK]);
    expect(result.current.total).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.error).toBeNull();
  });

  it("does not send empty search or filter parameters", async () => {
    mockedListTasks.mockResolvedValue(createPage());

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockedListTasks.mock.calls[0]?.[0]).not.toHaveProperty("search");
    expect(mockedListTasks.mock.calls[0]?.[0]).not.toHaveProperty("status");
    expect(mockedListTasks.mock.calls[0]?.[0]).not.toHaveProperty("priority");
  });

  it("debounces search for 300ms and sends the trimmed term", async () => {
    vi.useFakeTimers();
    mockedListTasks.mockResolvedValue(createPage());

    const { result } = renderHook(() => useTasks());

    await flushPromises();
    expect(mockedListTasks).toHaveBeenCalledTimes(1);

    act(() => result.current.setSearch("  báo cáo  "));

    expect(result.current.search).toBe("  báo cáo  ");
    expect(mockedListTasks).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });

    expect(mockedListTasks).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(mockedListTasks).toHaveBeenCalledTimes(2);
    expect(mockedListTasks.mock.calls[1]?.[0]).toEqual({
      page: 1,
      page_size: DEFAULT_TASK_PAGE_SIZE,
      search: "báo cáo",
    });
    expect(result.current.debouncedSearch).toBe("báo cáo");
  });

  it("only sends the latest term after rapid search changes", async () => {
    vi.useFakeTimers();
    mockedListTasks.mockResolvedValue(createPage());

    const { result } = renderHook(() => useTasks());

    await flushPromises();

    act(() => result.current.setSearch("b"));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => result.current.setSearch("bá"));
    act(() => {
      vi.advanceTimersByTime(100);
    });
    act(() => result.current.setSearch("báo"));
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS - 1);
    });

    expect(mockedListTasks).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(mockedListTasks).toHaveBeenCalledTimes(2);
    expect(mockedListTasks.mock.calls[1]?.[0]).toMatchObject({
      search: "báo",
      page: 1,
    });
  });

  it("omits a whitespace-only search term", async () => {
    vi.useFakeTimers();
    mockedListTasks.mockResolvedValue(createPage());

    const { result } = renderHook(() => useTasks());

    await flushPromises();

    act(() => result.current.setSearch("   "));

    await act(async () => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      await Promise.resolve();
    });

    expect(mockedListTasks).toHaveBeenCalledTimes(1);
    expect(result.current.debouncedSearch).toBe("");
  });

  it("applies a status filter and returns to the first page", async () => {
    mockedListTasks.mockResolvedValue(createPage({ total_pages: 3, total: 3 }));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(2));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(2));

    act(() => result.current.setStatus("IN_PROGRESS"));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(3));

    expect(mockedListTasks.mock.calls[2]?.[0]).toEqual({
      page: 1,
      page_size: DEFAULT_TASK_PAGE_SIZE,
      status: "IN_PROGRESS",
    });
    expect(result.current.status).toBe("IN_PROGRESS");
    expect(result.current.page).toBe(1);
  });

  it("applies a priority filter and returns to the first page", async () => {
    mockedListTasks.mockResolvedValue(createPage({ total_pages: 3, total: 3 }));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(3));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(2));

    act(() => result.current.setPriority("HIGH"));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(3));

    expect(mockedListTasks.mock.calls[2]?.[0]).toEqual({
      page: 1,
      page_size: DEFAULT_TASK_PAGE_SIZE,
      priority: "HIGH",
    });
    expect(result.current.priority).toBe("HIGH");
    expect(result.current.page).toBe(1);
  });

  it("clamps page navigation to the available page range", async () => {
    mockedListTasks.mockResolvedValue(createPage({ total_pages: 3, total: 3 }));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(99));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(2));
    expect(result.current.page).toBe(3);
    expect(mockedListTasks.mock.calls[1]?.[0]).toMatchObject({ page: 3 });

    act(() => result.current.setPage(-4));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(3));
    expect(result.current.page).toBe(1);
    expect(mockedListTasks.mock.calls[2]?.[0]).toMatchObject({ page: 1 });
  });

  it("changes page size, returns to the first page, and clamps 1-100", async () => {
    mockedListTasks.mockResolvedValue(createPage({ total_pages: 4, total: 40 }));

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.setPage(3));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(2));

    act(() => result.current.setPageSize(50));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(3));
    expect(mockedListTasks.mock.calls[2]?.[0]).toEqual({
      page: 1,
      page_size: 50,
    });
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(50);

    act(() => result.current.setPageSize(0));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(4));
    expect(mockedListTasks.mock.calls[3]?.[0]).toMatchObject({ page_size: 1 });

    act(() => result.current.setPageSize(500));

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(5));
    expect(mockedListTasks.mock.calls[4]?.[0]).toMatchObject({
      page_size: 100,
    });
  });

  it("clears search, filters, and pagination together", async () => {
    vi.useFakeTimers();
    mockedListTasks.mockResolvedValue(createPage({ total_pages: 3, total: 3 }));

    const { result } = renderHook(() => useTasks());

    await flushPromises();

    act(() => {
      result.current.setStatus("DONE");
      result.current.setPriority("HIGH");
      result.current.setSearch("báo cáo");
    });

    await act(async () => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
      await Promise.resolve();
    });

    const filteredCall = mockedListTasks.mock.calls.at(-1)?.[0];

    expect(filteredCall).toMatchObject({
      search: "báo cáo",
      status: "DONE",
      priority: "HIGH",
      page: 1,
    });

    act(() => result.current.clearFilters());

    await act(async () => {
      await Promise.resolve();
    });

    expect(mockedListTasks.mock.calls.at(-1)?.[0]).toEqual({
      page: 1,
      page_size: DEFAULT_TASK_PAGE_SIZE,
    });
    expect(result.current.search).toBe("");
    expect(result.current.debouncedSearch).toBe("");
    expect(result.current.status).toBeNull();
    expect(result.current.priority).toBeNull();
    expect(result.current.page).toBe(1);
  });

  it("normalizes failures and exposes no stale task data", async () => {
    mockedListTasks.mockRejectedValue(
      new ApiError(
        "Unable to reach the server. Check your connection and try again.",
        { isNetworkError: true },
      ),
    );

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.error).toMatchObject({ isNetworkError: true });
    expect(result.current.total).toBe(0);
    expect(result.current.totalPages).toBe(0);
  });

  it("ignores cancelled requests without surfacing an error", async () => {
    mockedListTasks.mockRejectedValue(new CanceledError("Request cancelled"));

    const { result } = renderHook(() => useTasks());

    await flushPromises();

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([]);
  });

  it("retries after a failed request", async () => {
    mockedListTasks
      .mockRejectedValueOnce(
        new ApiError(
          "Unable to reach the server. Check your connection and try again.",
          { isNetworkError: true },
        ),
      )
      .mockResolvedValueOnce(createPage());

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.refetch());

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.items).toEqual([TASK]);
    expect(mockedListTasks).toHaveBeenCalledTimes(2);
  });

  it("aborts the previous request and ignores its stale response", async () => {
    const firstRequest = createDeferred<PaginatedTasksResponse>();
    const secondRequest = createDeferred<PaginatedTasksResponse>();
    const newerTask: Task = { ...TASK, id: 99, title: "Công việc mới" };
    const newerPage = createPage({ items: [newerTask], total: 1 });

    mockedListTasks
      .mockReturnValueOnce(firstRequest.promise)
      .mockReturnValueOnce(secondRequest.promise);

    const { result } = renderHook(() => useTasks());

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(1));

    const firstSignal = mockedListTasks.mock.calls[0]?.[1];

    act(() => result.current.refetch());

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(2));

    expect(firstSignal?.aborted).toBe(true);

    await act(async () => {
      secondRequest.resolve(newerPage);
      await secondRequest.promise;
    });

    await waitFor(() => expect(result.current.items).toEqual([newerTask]));

    await act(async () => {
      firstRequest.resolve(createPage());
      await firstRequest.promise;
    });

    expect(result.current.items).toEqual([newerTask]);
  });

  it("aborts an outstanding request on unmount", async () => {
    const request = createDeferred<PaginatedTasksResponse>();
    mockedListTasks.mockReturnValue(request.promise);

    const { unmount } = renderHook(() => useTasks());

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalledTimes(1));

    const signal = mockedListTasks.mock.calls[0]?.[1];

    expect(signal?.aborted).toBe(false);

    unmount();

    expect(signal?.aborted).toBe(true);
  });

  it("allows a fresh request after a StrictMode setup is discarded", async () => {
    mockedListTasks.mockResolvedValue(createPage());

    const firstRender = renderHook(() => useTasks(), {
      wrapper: StrictWrapper,
    });

    await waitFor(() => expect(mockedListTasks).toHaveBeenCalled());

    const callsBeforeUnmount = mockedListTasks.mock.calls.length;
    firstRender.unmount();

    const secondRender = renderHook(() => useTasks(), {
      wrapper: StrictWrapper,
    });

    await waitFor(() =>
      expect(secondRender.result.current.isLoading).toBe(false),
    );

    expect(mockedListTasks.mock.calls.length).toBeGreaterThan(
      callsBeforeUnmount,
    );
    expect(secondRender.result.current.items).toEqual([TASK]);
    expect(secondRender.result.current.error).toBeNull();
  });
});
