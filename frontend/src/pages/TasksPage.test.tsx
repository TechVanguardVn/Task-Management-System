import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useSearchParams } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../lib/api-errors";
import { formatDateTime } from "../lib/date";
import * as tasksApi from "../services/tasks-api";
import type { UseTasksResult } from "../hooks/useTasks";
import type { Task } from "../types/task";
import { TasksPage } from "./TasksPage";

const { useTasksMock } = vi.hoisted(() => ({
  useTasksMock: vi.fn(),
}));

vi.mock("../hooks/useTasks", () => ({
  useTasks: useTasksMock,
}));

vi.mock("../services/tasks-api", () => ({
  getTask: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  patchTaskStatus: vi.fn(),
  deleteTask: vi.fn(),
}));

const setSearchMock = vi.fn();
const setStatusMock = vi.fn();
const setPriorityMock = vi.fn();
const clearFiltersMock = vi.fn();
const setPageMock = vi.fn();
const setPageSizeMock = vi.fn();
const refetchMock = vi.fn();

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

function mockTasksResult(overrides: Partial<UseTasksResult> = {}) {
  useTasksMock.mockReturnValue({
    items: [TASK],
    total: 1,
    page: 1,
    pageSize: 10,
    totalPages: 1,
    search: "",
    debouncedSearch: "",
    status: null,
    priority: null,
    isLoading: false,
    error: null,
    refetch: refetchMock,
    setPage: setPageMock,
    setPageSize: setPageSizeMock,
    setSearch: setSearchMock,
    setStatus: setStatusMock,
    setPriority: setPriorityMock,
    clearFilters: clearFiltersMock,
    ...overrides,
  } satisfies UseTasksResult);
}

function LocationDisplay() {
  const [searchParams] = useSearchParams();
  return <div data-testid="search-params">{searchParams.toString()}</div>;
}

function renderTasksPage(initialEntries: string[] = ["/tasks"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <TasksPage />
      <LocationDisplay />
    </MemoryRouter>,
  );
}

describe("TasksPage", () => {
  let scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockTasksResult();

    scrollIntoViewMock = vi.fn();
    window.HTMLElement.prototype.scrollIntoView =
      scrollIntoViewMock as unknown as typeof HTMLElement.prototype.scrollIntoView;

    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the task workspace heading and intro", () => {
    renderTasksPage();

    expect(
      screen.getByRole("heading", { name: "Quản lý công việc" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Quản lý tiến độ, sắp xếp ưu tiên và theo dõi hạn chót.",
      ),
    ).toBeInTheDocument();
  });

  it("renders task data with Vietnamese status and priority labels", () => {
    renderTasksPage();

    const table = screen.getByRole("table");

    expect(within(table).getByText(TASK.title)).toBeInTheDocument();
    expect(
      within(table).getByText("Hoàn thiện báo cáo trước cuối tuần."),
    ).toBeInTheDocument();
    expect(
      within(table).getAllByText("Đang làm").length,
    ).toBeGreaterThanOrEqual(1);
    expect(within(table).getByText("Cao")).toBeInTheDocument();
    expect(
      within(table).getByText(
        formatDateTime(TASK.due_date, "vi-VN", "Chưa đặt hạn"),
      ),
    ).toBeInTheDocument();
    expect(
      within(table).getByText(formatDateTime(TASK.updated_at, "vi-VN")),
    ).toBeInTheDocument();
  });

  it("does not expose internal ids and provides interactive actions", () => {
    renderTasksPage();

    const table = screen.getByRole("table");

    expect(within(table).queryByText("42")).not.toBeInTheDocument();
    expect(within(table).queryByText("7")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Tạo công việc" }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("button", {
        name: 'Xem chi tiết "Nộp báo cáo thử việc"',
      }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("button", {
        name: 'Chỉnh sửa "Nộp báo cáo thử việc"',
      }),
    ).toBeInTheDocument();
    expect(
      within(table).getByRole("button", {
        name: 'Xóa "Nộp báo cáo thử việc"',
      }),
    ).toBeInTheDocument();
    expect(
      within(table).getByLabelText('Đổi trạng thái cho "Nộp báo cáo thử việc"'),
    ).toBeInTheDocument();
  });

  it("updates search, status, and priority filters", async () => {
    const user = userEvent.setup();
    mockTasksResult({ search: "báo cáo", debouncedSearch: "báo cáo" });
    renderTasksPage();

    const searchInput = screen.getByLabelText("Tìm kiếm");

    await user.type(searchInput, "!");
    expect(setSearchMock).toHaveBeenLastCalledWith("báo cáo!");

    await user.selectOptions(screen.getByLabelText("Trạng thái"), "DONE");
    expect(setStatusMock).toHaveBeenLastCalledWith("DONE");

    await user.selectOptions(screen.getByLabelText("Mức ưu tiên"), "LOW");
    expect(setPriorityMock).toHaveBeenLastCalledWith("LOW");
  });

  it("clears every active filter", async () => {
    const user = userEvent.setup();
    mockTasksResult({ search: "báo cáo", debouncedSearch: "báo cáo" });
    renderTasksPage();

    await user.click(screen.getByRole("button", { name: "Xóa bộ lọc" }));

    expect(clearFiltersMock).toHaveBeenCalledTimes(1);
  });

  it("disables the filter reset when no filter is active", () => {
    renderTasksPage();

    expect(
      screen.getByRole("button", { name: "Xóa bộ lọc" }),
    ).toBeDisabled();
  });

  it("announces the loading state", () => {
    mockTasksResult({
      items: [],
      total: 0,
      totalPages: 0,
      isLoading: true,
    });
    renderTasksPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang tải danh sách công việc.",
    );
    expect(
      screen.getByLabelText("Đang tải danh sách công việc"),
    ).toHaveAttribute("aria-busy", "true");
  });

  it("shows a recoverable network error without exposing raw details", async () => {
    const user = userEvent.setup();
    mockTasksResult({
      items: [],
      total: 0,
      totalPages: 0,
      error: new ApiError("Raw backend failure", {
        isNetworkError: true,
      }),
    });
    renderTasksPage();

    const alert = screen.getByRole("alert");

    expect(alert).toHaveTextContent("Không thể tải danh sách công việc.");
    expect(alert).toHaveTextContent(
      "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.",
    );
    expect(alert).not.toHaveTextContent("Raw backend failure");

    await user.click(within(alert).getByRole("button", { name: "Thử lại" }));

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("shows the empty-account message without a creation action link", () => {
    mockTasksResult({ items: [], total: 0, totalPages: 0 });
    renderTasksPage();

    expect(
      screen.getByRole("heading", {
        name: "Bạn chưa có công việc nào.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Tạo công việc/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a filtered empty state and lets the user reset filters", async () => {
    const user = userEvent.setup();
    mockTasksResult({
      items: [],
      total: 0,
      totalPages: 0,
      search: "không tồn tại",
      debouncedSearch: "không tồn tại",
    });
    renderTasksPage();

    expect(
      screen.getByRole("heading", {
        name: "Không tìm thấy công việc phù hợp.",
      }),
    ).toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", {
      name: "Xóa bộ lọc",
    });
    const emptyStateButton = clearButtons.at(-1);

    expect(emptyStateButton).toBeDefined();

    if (emptyStateButton) {
      await user.click(emptyStateButton);
    }

    expect(clearFiltersMock).toHaveBeenCalledTimes(1);
  });

  it("renders pagination and forwards page and page-size changes", async () => {
    const user = userEvent.setup();
    mockTasksResult({
      page: 2,
      pageSize: 10,
      total: 42,
      totalPages: 5,
    });
    renderTasksPage();

    const pagination = screen.getByRole("navigation", {
      name: "Phân trang công việc",
    });

    expect(pagination).toHaveTextContent("Trang 2 / 5");
    expect(pagination).toHaveTextContent("Tổng 42 công việc");

    await user.click(
      within(pagination).getByRole("button", { name: "Trang sau" }),
    );
    expect(setPageMock).toHaveBeenLastCalledWith(3);

    await user.click(
      within(pagination).getByRole("button", { name: "Trang trước" }),
    );
    expect(setPageMock).toHaveBeenLastCalledWith(1);

    await user.selectOptions(within(pagination).getByLabelText("Số dòng"), "20");
    expect(setPageSizeMock).toHaveBeenLastCalledWith(20);
  });

  it("hides pagination when the result set is empty", () => {
    mockTasksResult({ items: [], total: 0, totalPages: 0 });
    renderTasksPage();

    expect(
      screen.queryByRole("navigation", { name: "Phân trang công việc" }),
    ).not.toBeInTheDocument();
  });

  describe("CRUD integration flows", () => {
    it("opens Create modal, submits new task, clears filters, and refetches", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.createTask).mockResolvedValue({
        ...TASK,
        id: 43,
        title: "Viết test mới",
      });

      renderTasksPage();

      await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

      expect(
        await screen.findByRole("heading", { name: "Tạo công việc" }),
      ).toBeInTheDocument();

      await user.type(screen.getByLabelText("Tiêu đề"), "Viết test mới");

      const submitBtn = within(screen.getByRole("dialog")).getByRole("button", {
        name: "Tạo công việc",
      });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(tasksApi.createTask).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Viết test mới",
            status: "TODO",
            priority: "MEDIUM",
          }),
        );
      });

      expect(refetchMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens Details modal when 'Chi tiết' is clicked and handles transition to Edit", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.getTask).mockResolvedValue(TASK);

      renderTasksPage();

      await user.click(
        screen.getByRole("button", {
          name: 'Xem chi tiết "Nộp báo cáo thử việc"',
        }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Nộp báo cáo thử việc" }),
        ).toBeInTheDocument();
      });

      // Does not trigger a redundant getTask because initialTask is supplied from current list
      expect(tasksApi.getTask).not.toHaveBeenCalled();

      // Transition to Edit
      await user.click(
        within(screen.getByRole("dialog")).getByRole("button", {
          name: "Chỉnh sửa",
        }),
      );

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Chỉnh sửa công việc" }),
        ).toBeInTheDocument();
      });

      expect(screen.getByLabelText("Tiêu đề")).toHaveValue("Nộp báo cáo thử việc");
    });

    it("edits task, sends full 5 fields payload, and refetches list", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.updateTask).mockResolvedValue({
        ...TASK,
        title: "Nộp báo cáo cập nhật",
      });

      renderTasksPage();

      await user.click(
        screen.getByRole("button", {
          name: 'Chỉnh sửa "Nộp báo cáo thử việc"',
        }),
      );

      expect(
        await screen.findByRole("heading", { name: "Chỉnh sửa công việc" }),
      ).toBeInTheDocument();

      const titleInput = screen.getByLabelText("Tiêu đề");
      await user.clear(titleInput);
      await user.type(titleInput, "Nộp báo cáo cập nhật");

      await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

      await waitFor(() => {
        expect(tasksApi.updateTask).toHaveBeenCalledWith(
          42,
          expect.objectContaining({
            title: "Nộp báo cáo cập nhật",
            description: TASK.description,
            status: TASK.status,
            priority: TASK.priority,
          }),
        );
      });

      expect(refetchMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("opens Delete dialog, confirms deletion, and refetches", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.deleteTask).mockResolvedValue(undefined);

      renderTasksPage();

      await user.click(
        screen.getByRole("button", {
          name: 'Xóa "Nộp báo cáo thử việc"',
        }),
      );

      expect(
        await screen.findByRole("heading", { name: "Xóa công việc này?" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/"Nộp báo cáo thử việc"/),
      ).toBeInTheDocument();

      await user.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa" }),
      );

      await waitFor(() => {
        expect(tasksApi.deleteTask).toHaveBeenCalledWith(42);
      });

      expect(refetchMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("moves to previous page when deleting the last item on page > 1", async () => {
      const user = userEvent.setup();
      mockTasksResult({
        page: 3,
        items: [TASK],
        total: 21,
        totalPages: 3,
      });

      vi.mocked(tasksApi.deleteTask).mockResolvedValue(undefined);

      renderTasksPage();

      await user.click(
        screen.getByRole("button", {
          name: 'Xóa "Nộp báo cáo thử việc"',
        }),
      );

      await user.click(
        within(screen.getByRole("dialog")).getByRole("button", { name: "Xóa" }),
      );

      await waitFor(() => {
        expect(tasksApi.deleteTask).toHaveBeenCalledWith(42);
      });

      expect(setPageMock).toHaveBeenCalledWith(2);
      expect(refetchMock).not.toHaveBeenCalled();
    });

    it("changes status quickly via quick status dropdown", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.patchTaskStatus).mockResolvedValue({
        ...TASK,
        status: "DONE",
      });

      renderTasksPage();

      const select = screen.getByLabelText(
        'Đổi trạng thái cho "Nộp báo cáo thử việc"',
      );

      await user.selectOptions(select, "DONE");

      await waitFor(() => {
        expect(tasksApi.patchTaskStatus).toHaveBeenCalledWith(42, {
          status: "DONE",
        });
      });

      expect(refetchMock).toHaveBeenCalledTimes(1);
    });

    it("displays error banner and rolls back on quick status failure", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.patchTaskStatus).mockRejectedValue(
        new ApiError("Update failed", { status: 500 }),
      );

      renderTasksPage();

      const select = screen.getByLabelText(
        'Đổi trạng thái cho "Nộp báo cáo thử việc"',
      );

      await user.selectOptions(select, "DONE");

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Không thể cập nhật trạng thái công việc. Vui lòng thử lại.",
        );
      });

      // Local status rolled back to previous
      expect(select).toHaveValue("IN_PROGRESS");

      // Dismiss alert
      await user.click(screen.getByLabelText("Đóng thông báo"));
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("closes modal on Escape key", async () => {
      const user = userEvent.setup();
      renderTasksPage();

      await user.click(screen.getByRole("button", { name: "Tạo công việc" }));
      expect(await screen.findByRole("dialog")).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("Step 4 URL Highlight Integration", () => {
    it("does nothing when no highlight param is present", () => {
      renderTasksPage(["/tasks"]);

      expect(tasksApi.getTask).not.toHaveBeenCalled();
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });

    it("cleans up invalid highlight params without calling API or scrolling", async () => {
      renderTasksPage(["/tasks?highlight=abc&tab=active"]);

      await waitFor(() => {
        expect(screen.getByTestId("search-params")).toHaveTextContent(
          "tab=active",
        );
        expect(screen.getByTestId("search-params")).not.toHaveTextContent(
          "highlight",
        );
      });

      expect(tasksApi.getTask).not.toHaveBeenCalled();
      expect(scrollIntoViewMock).not.toHaveBeenCalled();
    });

    it("rejects negative highlight ID and cleans up query", async () => {
      renderTasksPage(["/tasks?highlight=-10"]);
      await waitFor(() => {
        expect(screen.getByTestId("search-params")).toHaveTextContent("");
      });
      expect(tasksApi.getTask).not.toHaveBeenCalled();
    });

    it("rejects zero highlight ID and cleans up query", async () => {
      renderTasksPage(["/tasks?highlight=0"]);
      await waitFor(() => {
        expect(screen.getByTestId("search-params")).toHaveTextContent("");
      });
      expect(tasksApi.getTask).not.toHaveBeenCalled();
    });

    it("rejects decimal highlight ID and cleans up query", async () => {
      renderTasksPage(["/tasks?highlight=1.5"]);
      await waitFor(() => {
        expect(screen.getByTestId("search-params")).toHaveTextContent("");
      });
      expect(tasksApi.getTask).not.toHaveBeenCalled();
    });

    it("highlights task row, scrolls with center alignment, and cleans up after 3s when task is on current page", () => {
      vi.useFakeTimers();

      renderTasksPage(["/tasks?highlight=42&tab=active"]);

      // Verify row is highlighted
      const row = document.getElementById("task-row-42");
      expect(row).toBeInTheDocument();
      expect(row).toHaveAttribute("data-highlighted", "true");

      // Verify scroll called with center alignment
      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "smooth",
        block: "center",
      });

      // Does not call fallback getTask
      expect(tasksApi.getTask).not.toHaveBeenCalled();

      // Advance timers by 3000ms
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      // Highlight removed
      expect(row).not.toHaveAttribute("data-highlighted");

      // Query param cleaned up while tab=active is preserved
      expect(screen.getByTestId("search-params")).toHaveTextContent(
        "tab=active",
      );
      expect(screen.getByTestId("search-params")).not.toHaveTextContent(
        "highlight",
      );
    });

    it("respects prefers-reduced-motion by using behavior: auto for scroll", () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion: reduce"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      renderTasksPage(["/tasks?highlight=42"]);

      expect(scrollIntoViewMock).toHaveBeenCalledWith({
        behavior: "auto",
        block: "center",
      });
    });

    it("does not scroll or highlight prematurely while list is loading", () => {
      mockTasksResult({
        isLoading: true,
        items: [],
      });

      renderTasksPage(["/tasks?highlight=42"]);

      expect(scrollIntoViewMock).not.toHaveBeenCalled();
      expect(tasksApi.getTask).not.toHaveBeenCalled();
    });

    it("triggers single getTask fallback when task is not on current page", async () => {
      const offPageTask: Task = {
        id: 102,
        user_id: 1,
        title: "Báo cáo doanh số tháng 11",
        description: "Thu thập số liệu",
        status: "TODO",
        priority: "MEDIUM",
        due_date: "2026-11-30T17:00:00Z",
        created_at: "2026-11-01T08:00:00Z",
        updated_at: "2026-11-05T10:00:00Z",
      };

      vi.mocked(tasksApi.getTask).mockResolvedValue(offPageTask);

      renderTasksPage(["/tasks?highlight=102"]);

      expect(tasksApi.getTask).toHaveBeenCalledTimes(1);
      expect(tasksApi.getTask).toHaveBeenCalledWith(102, expect.any(AbortSignal));

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
        expect(
          screen.getByText(/"Báo cáo doanh số tháng 11"/),
        ).toBeInTheDocument();
      });

      // Query param is cleaned up
      await waitFor(() => {
        expect(screen.getByTestId("search-params")).not.toHaveTextContent(
          "highlight",
        );
      });

      // Current page or filters are NOT altered
      expect(setPageMock).not.toHaveBeenCalled();
      expect(setSearchMock).not.toHaveBeenCalled();
      expect(setStatusMock).not.toHaveBeenCalled();

      // Open details modal from banner
      const user = userEvent.setup();
      const viewDetailsBtn = within(screen.getByRole("status")).getByRole(
        "button",
        { name: "Xem chi tiết" },
      );
      await user.click(viewDetailsBtn);

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(
          screen.getByRole("heading", { name: "Báo cáo doanh số tháng 11" }),
        ).toBeInTheDocument();
      });

      // Exactly 1 call was made (the initial banner lookup). No duplicate GET was fired on modal open!
      expect(tasksApi.getTask).toHaveBeenCalledTimes(1);
    });

    it("displays 404 message and cleans up query when task does not exist", async () => {
      vi.mocked(tasksApi.getTask).mockRejectedValue(
        new ApiError("Not found", { status: 404 }),
      );

      renderTasksPage(["/tasks?highlight=999"]);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Công việc này không tồn tại hoặc đã bị xóa.",
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("search-params")).not.toHaveTextContent(
          "highlight",
        );
      });
      expect(tasksApi.getTask).toHaveBeenCalledTimes(1);
    });

    it("displays retry banner on network error and retries on button click", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.getTask)
        .mockRejectedValueOnce(
          new ApiError("Connection refused", { isNetworkError: true }),
        )
        .mockResolvedValueOnce({
          ...TASK,
          id: 102,
          title: "Báo cáo thử việc đợt 2",
        });

      renderTasksPage(["/tasks?highlight=102"]);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.",
        );
      });

      const retryBtn = screen.getByRole("button", { name: /Thử lại/ });
      await user.click(retryBtn);

      await waitFor(() => {
        expect(tasksApi.getTask).toHaveBeenCalledTimes(2);
        expect(
          screen.getByText(/"Báo cáo thử việc đợt 2"/),
        ).toBeInTheDocument();
      });
    });

    it("aborts fallback getTask request when highlight query changes or component unmounts", () => {
      let capturedSignal: AbortSignal | undefined;
      vi.mocked(tasksApi.getTask).mockImplementation((_id, signal) => {
        capturedSignal = signal;
        return new Promise(() => {});
      });

      const { unmount } = renderTasksPage(["/tasks?highlight=102"]);

      expect(capturedSignal?.aborted).toBe(false);
      unmount();
      expect(capturedSignal?.aborted).toBe(true);
    });

    it("dismisses highlight banner when close button is clicked", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.getTask).mockResolvedValue({
        ...TASK,
        id: 102,
        title: "Công việc ngoài trang",
      });

      renderTasksPage(["/tasks?highlight=102"]);

      await waitFor(() => {
        expect(screen.getByRole("status")).toBeInTheDocument();
      });

      const closeBtn = screen.getByRole("button", {
        name: "Đóng thông báo liên kết",
      });
      await user.click(closeBtn);

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
