import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../lib/api-errors";
import { listTasks, patchTaskStatus } from "../../services/tasks-api";
import type { PaginatedTasksResponse, Task } from "../../types/task";
import { KanbanBoard } from "./KanbanBoard";

vi.mock("../../services/tasks-api", () => ({
  listTasks: vi.fn(),
  patchTaskStatus: vi.fn(),
}));

const mockedListTasks = vi.mocked(listTasks);
const mockedPatchTaskStatus = vi.mocked(patchTaskStatus);

const TASK_1: Task = {
  id: 1,
  user_id: 10,
  title: "Thiết kế giao diện",
  description: "Thiết kế Kanban board theo Light Theme",
  status: "TODO",
  priority: "HIGH",
  due_date: "2026-11-20T09:00:00Z",
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-01T08:00:00Z",
};

const TASK_2: Task = {
  id: 2,
  user_id: 10,
  title: "Tích hợp kéo thả",
  description: "Dùng native HTML5 Drag and Drop",
  status: "IN_PROGRESS",
  priority: "MEDIUM",
  due_date: "2026-11-25T15:00:00Z",
  created_at: "2026-11-02T08:00:00Z",
  updated_at: "2026-11-02T08:00:00Z",
};

const TASK_3: Task = {
  id: 3,
  user_id: 10,
  title: "Viết GitHub Actions CI",
  description: "Tạo workflow CI tự động",
  status: "DONE",
  priority: "LOW",
  due_date: null,
  created_at: "2026-11-03T08:00:00Z",
  updated_at: "2026-11-03T08:00:00Z",
};

function createPageResponse(
  items: Task[],
  overrides: Partial<PaginatedTasksResponse> = {},
): PaginatedTasksResponse {
  return {
    items,
    total: items.length,
    page: 1,
    page_size: 100,
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

describe("KanbanBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders three columns correctly with titles and column counts", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1, TASK_2, TASK_3]),
    );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Cần làm" })).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Đang thực hiện" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Hoàn thành" })).toBeInTheDocument();
    });

    const todoCol = screen.getByRole("region", { name: /Cần làm/i });
    const inProgressCol = screen.getByRole("region", { name: /Đang thực hiện/i });
    const doneCol = screen.getByRole("region", { name: /Hoàn thành/i });

    expect(within(todoCol).getByLabelText("1 công việc")).toBeInTheDocument();
    expect(within(inProgressCol).getByLabelText("1 công việc")).toBeInTheDocument();
    expect(within(doneCol).getByLabelText("1 công việc")).toBeInTheDocument();
  });

  it("groups tasks by correct status across columns", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1, TASK_2, TASK_3]),
    );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const todoCol = screen.getByRole("region", { name: /Cần làm/i });
    const inProgressCol = screen.getByRole("region", { name: /Đang thực hiện/i });
    const doneCol = screen.getByRole("region", { name: /Hoàn thành/i });

    expect(within(todoCol).getByText("Thiết kế giao diện")).toBeInTheDocument();
    expect(within(inProgressCol).getByText("Tích hợp kéo thả")).toBeInTheDocument();
    expect(within(doneCol).getByText("Viết GitHub Actions CI")).toBeInTheDocument();
  });

  it("displays empty column state when a column has no tasks", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1]),
    );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const inProgressCol = screen.getByRole("region", { name: /Đang thực hiện/i });
    expect(
      within(inProgressCol).getByText("Chưa có công việc nào trong cột này."),
    ).toBeInTheDocument();
  });

  it("displays empty board state when total tasks is zero", async () => {
    mockedListTasks.mockResolvedValueOnce(createPageResponse([]));

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Bạn chưa có công việc nào.")).toBeInTheDocument();
    });
  });

  it("displays initial loading skeleton while fetching", () => {
    mockedListTasks.mockReturnValueOnce(new Promise(() => {}));

    render(<KanbanBoard />);

    expect(screen.getByLabelText("Đang tải bảng Kanban")).toBeInTheDocument();
  });

  it("displays API error state and allows refetching on retry", async () => {
    mockedListTasks.mockRejectedValueOnce(
      new ApiError("Máy chủ gián đoạn", { status: 500 }),
    );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Không thể tải bảng Kanban")).toBeInTheDocument();
    });

    mockedListTasks.mockResolvedValueOnce(createPageResponse([TASK_1]));

    const retryBtn = screen.getByRole("button", { name: /Thử lại/i });
    await userEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });
  });

  it("handles successful drag-and-drop between columns and calls patchTaskStatus", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1]),
    );

    const updatedTask: Task = { ...TASK_1, status: "IN_PROGRESS" };
    mockedPatchTaskStatus.mockResolvedValueOnce(updatedTask);

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const card = screen.getByRole("article", { name: /Thiết kế giao diện/i });
    const inProgressCol = screen.getByRole("region", { name: /Đang thực hiện/i });

    const dataTransfer = {
      data: {} as Record<string, string>,
      setData(key: string, value: string) {
        this.data[key] = value;
      },
      getData(key: string) {
        return this.data[key] || "";
      },
      effectAllowed: "",
      dropEffect: "",
    };

    fireEvent.dragStart(card, { dataTransfer });
    fireEvent.dragOver(inProgressCol, { dataTransfer });
    fireEvent.drop(inProgressCol, { dataTransfer });

    await waitFor(() => {
      expect(mockedPatchTaskStatus).toHaveBeenCalledWith(1, {
        status: "IN_PROGRESS",
      });
    });

    await waitFor(() => {
      expect(within(inProgressCol).getByText("Thiết kế giao diện")).toBeInTheDocument();
    });
  });

  it("reconciles UI with server response upon successful PATCH", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1]),
    );

    const updatedTask: Task = {
      ...TASK_1,
      status: "DONE",
      title: "Thiết kế giao diện (Đã duyệt)",
    };
    mockedPatchTaskStatus.mockResolvedValueOnce(updatedTask);

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const select = screen.getByLabelText(
      "Di chuyển trạng thái công việc Thiết kế giao diện",
    );
    await userEvent.selectOptions(select, "DONE");

    await waitFor(() => {
      expect(
        screen.getByText("Thiết kế giao diện (Đã duyệt)"),
      ).toBeInTheDocument();
    });
  });

  it("rolls back only the affected task when PATCH fails, leaving others intact", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1, TASK_2]),
    );

    mockedPatchTaskStatus.mockRejectedValueOnce(
      new ApiError("Lỗi cập nhật", { status: 500 }),
    );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const select = screen.getByLabelText(
      "Di chuyển trạng thái công việc Thiết kế giao diện",
    );
    await userEvent.selectOptions(select, "DONE");

    // Rolled back to TODO
    await waitFor(() => {
      const todoCol = screen.getByRole("region", { name: /Cần làm/i });
      expect(within(todoCol).getByText("Thiết kế giao diện")).toBeInTheDocument();
      expect(
        screen.getByText(/Không thể cập nhật trạng thái/i),
      ).toBeInTheDocument();
    });

    // TASK_2 remains in IN_PROGRESS
    const inProgressCol = screen.getByRole("region", { name: /Đang thực hiện/i });
    expect(within(inProgressCol).getByText("Tích hợp kéo thả")).toBeInTheDocument();
  });

  it("supports concurrent updates for different tasks", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1, TASK_2]),
    );

    const deferred1 = createDeferred<Task>();
    const deferred2 = createDeferred<Task>();

    mockedPatchTaskStatus
      .mockReturnValueOnce(deferred1.promise)
      .mockReturnValueOnce(deferred2.promise);

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const select1 = screen.getByLabelText(
      "Di chuyển trạng thái công việc Thiết kế giao diện",
    );
    const select2 = screen.getByLabelText(
      "Di chuyển trạng thái công việc Tích hợp kéo thả",
    );

    await userEvent.selectOptions(select1, "IN_PROGRESS");
    await userEvent.selectOptions(select2, "DONE");

    expect(mockedPatchTaskStatus).toHaveBeenCalledTimes(2);

    deferred1.resolve({ ...TASK_1, status: "IN_PROGRESS" });
    deferred2.resolve({ ...TASK_2, status: "DONE" });

    await waitFor(() => {
      const doneCol = screen.getByRole("region", { name: /Hoàn thành/i });
      expect(within(doneCol).getByText("Tích hợp kéo thả")).toBeInTheDocument();
    });
  });

  it("prevents duplicate updates to the same task while pending", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1]),
    );

    const deferred = createDeferred<Task>();
    mockedPatchTaskStatus.mockReturnValueOnce(deferred.promise);

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const select = screen.getByLabelText(
      "Di chuyển trạng thái công việc Thiết kế giao diện",
    );
    await userEvent.selectOptions(select, "IN_PROGRESS");

    expect(mockedPatchTaskStatus).toHaveBeenCalledTimes(1);

    // The select should now be disabled while updating in the target column
    await waitFor(() => {
      const pendingSelect = screen.getByLabelText(
        "Di chuyển trạng thái công việc Thiết kế giao diện",
      );
      expect(pendingSelect).toBeDisabled();
    });

    // Attempting a second drag or move while pending does not trigger patchTaskStatus again
    const inProgressCol = screen.getByRole("region", { name: /Đang thực hiện/i });
    const dataTransfer = {
      data: { "text/plain": "1" },
      setData: vi.fn(),
      getData: () => "1",
      effectAllowed: "",
      dropEffect: "",
    };
    fireEvent.drop(inProgressCol, { dataTransfer });

    expect(mockedPatchTaskStatus).toHaveBeenCalledTimes(1);

    deferred.resolve({ ...TASK_1, status: "IN_PROGRESS" });

    await waitFor(() => {
      const resolvedSelect = screen.getByLabelText(
        "Di chuyển trạng thái công việc Thiết kế giao diện",
      );
      expect(resolvedSelect).not.toBeDisabled();
    });
  });

  it("updates aria-live announcement region on status change", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1]),
    );

    mockedPatchTaskStatus.mockResolvedValueOnce({
      ...TASK_1,
      status: "DONE",
    });

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    const select = screen.getByLabelText(
      "Di chuyển trạng thái công việc Thiết kế giao diện",
    );
    await userEvent.selectOptions(select, "DONE");

    await waitFor(() => {
      expect(
        screen.getByText(
          'Đã chuyển công việc "Thiết kế giao diện" sang trạng thái Hoàn thành.',
        ),
      ).toBeInTheDocument();
    });
  });

  it("fetches additional pages when total_pages > 1", async () => {
    const page1Items = Array.from({ length: 100 }, (_, i) => ({
      ...TASK_1,
      id: i + 1,
      title: `Task ${i + 1}`,
    }));

    const page2Items = Array.from({ length: 50 }, (_, i) => ({
      ...TASK_2,
      id: i + 101,
      title: `Task ${i + 101}`,
    }));

    mockedListTasks
      .mockResolvedValueOnce(
        createPageResponse(page1Items, { total: 150, total_pages: 2 }),
      )
      .mockResolvedValueOnce(
        createPageResponse(page2Items, { page: 2, total: 150, total_pages: 2 }),
      );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(mockedListTasks).toHaveBeenCalledTimes(2);
      expect(screen.getByText("Task 1")).toBeInTheDocument();
      expect(screen.getByText("Task 150")).toBeInTheDocument();
    });
  });

  it("displays explicit notice when total exceeds 300 tasks cap", async () => {
    const page1Items = Array.from({ length: 100 }, (_, i) => ({
      ...TASK_1,
      id: i + 1,
      title: `Task ${i + 1}`,
    }));

    mockedListTasks
      .mockResolvedValueOnce(
        createPageResponse(page1Items, { total: 350, total_pages: 4 }),
      )
      .mockResolvedValueOnce(createPageResponse([], { page: 2 }))
      .mockResolvedValueOnce(createPageResponse([], { page: 3 }));

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Bảng Kanban hiện chỉ hiển thị tối đa 300 công việc/i),
      ).toBeInTheDocument();
      expect(screen.getByText("350")).toBeInTheDocument();
    });
  });

  it("reloads board when search or priority filter changes", async () => {
    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1, TASK_2]),
    );

    render(<KanbanBoard />);

    await waitFor(() => {
      expect(screen.getByText("Thiết kế giao diện")).toBeInTheDocument();
    });

    mockedListTasks.mockResolvedValueOnce(
      createPageResponse([TASK_1]),
    );

    const searchInput = screen.getByRole("searchbox", { name: /Tìm kiếm/i });
    await userEvent.type(searchInput, "Thiết kế");

    // Advance debounce
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 350));
    });

    await waitFor(() => {
      expect(mockedListTasks).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "Thiết kế",
        }),
        expect.any(AbortSignal),
      );
    });
  });
});
