import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "../../lib/api-errors";
import { formatDateTime } from "../../lib/date";
import * as tasksApi from "../../services/tasks-api";
import type { Task } from "../../types/task";
import { TaskDetailsModal } from "./TaskDetailsModal";

vi.mock("../../services/tasks-api", () => ({
  getTask: vi.fn(),
}));

const MOCK_TASK: Task = {
  id: 42,
  user_id: 1,
  title: "Hoàn thiện báo cáo quý",
  description: "Phân tích số liệu và hoàn thiện báo cáo tài chính.",
  status: "IN_PROGRESS",
  priority: "HIGH",
  due_date: "2026-11-20T17:00:00Z",
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-05T10:00:00Z",
};

describe("TaskDetailsModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state on mount", () => {
    vi.mocked(tasksApi.getTask).mockReturnValue(new Promise(() => {}));

    render(
      <TaskDetailsModal
        taskId={42}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Đang tải chi tiết công việc..."),
    ).toBeInTheDocument();
  });

  it("fetches the task using the provided taskId and displays all details", async () => {
    vi.mocked(tasksApi.getTask).mockResolvedValue(MOCK_TASK);

    render(
      <TaskDetailsModal
        taskId={42}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(tasksApi.getTask).toHaveBeenCalledWith(42, expect.any(AbortSignal));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Hoàn thiện báo cáo quý" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Phân tích số liệu và hoàn thiện báo cáo tài chính."),
    ).toBeInTheDocument();
    expect(screen.getByText("Đang làm")).toBeInTheDocument();
    expect(screen.getByText("Cao")).toBeInTheDocument();
    expect(
      screen.getByText(formatDateTime("2026-11-20T17:00:00Z", "vi-VN")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatDateTime("2026-11-01T08:00:00Z", "vi-VN")),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatDateTime("2026-11-05T10:00:00Z", "vi-VN")),
    ).toBeInTheDocument();

    // Internal ID should not be displayed to the user
    expect(screen.queryByText("42")).not.toBeInTheDocument();
  });

  it("renders appropriate fallbacks for null description and due_date", async () => {
    const taskWithoutDates: Task = {
      ...MOCK_TASK,
      description: null,
      due_date: null,
    };
    vi.mocked(tasksApi.getTask).mockResolvedValue(taskWithoutDates);

    render(
      <TaskDetailsModal
        taskId={42}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Chưa có mô tả")).toBeInTheDocument();
      expect(screen.getByText("Chưa đặt hạn")).toBeInTheDocument();
    });
  });

  it("displays 404 error message when task does not exist", async () => {
    vi.mocked(tasksApi.getTask).mockRejectedValue(
      new ApiError("Not found", { status: 404 }),
    );

    render(
      <TaskDetailsModal
        taskId={999}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Công việc không còn tồn tại hoặc đã bị xóa.",
      );
    });

    expect(screen.queryByRole("button", { name: "Thử lại" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Đóng" })).toBeInTheDocument();
  });

  it("handles network error and allows retry", async () => {
    const user = userEvent.setup();
    vi.mocked(tasksApi.getTask)
      .mockRejectedValueOnce(
        new ApiError("Network error", { isNetworkError: true }),
      )
      .mockResolvedValueOnce(MOCK_TASK);

    render(
      <TaskDetailsModal
        taskId={42}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.",
      );
    });

    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    await user.click(retryBtn);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Hoàn thiện báo cáo quý" }),
      ).toBeInTheDocument();
    });

    expect(tasksApi.getTask).toHaveBeenCalledTimes(2);
  });

  it("aborts the API request when modal unmounts", () => {
    let capturedSignal: AbortSignal | undefined;
    vi.mocked(tasksApi.getTask).mockImplementation((_id, signal) => {
      capturedSignal = signal;
      return new Promise(() => {});
    });

    const { unmount } = render(
      <TaskDetailsModal
        taskId={42}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });

  it("ignores stale response when taskId changes", async () => {
    let resolveFirst: (task: Task) => void = () => {};
    const firstPromise = new Promise<Task>((resolve) => {
      resolveFirst = resolve;
    });

    vi.mocked(tasksApi.getTask)
      .mockReturnValueOnce(firstPromise)
      .mockResolvedValueOnce({
        ...MOCK_TASK,
        id: 43,
        title: "Task mới 43",
      });

    const { rerender } = render(
      <TaskDetailsModal
        taskId={42}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    rerender(
      <TaskDetailsModal
        taskId={43}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Task mới 43" }),
      ).toBeInTheDocument();
    });

    // Resolve the first slow task
    resolveFirst({ ...MOCK_TASK, id: 42, title: "Task cũ 42" });

    // Should still display Task mới 43
    expect(
      screen.getByRole("heading", { name: "Task mới 43" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Task cũ 42")).not.toBeInTheDocument();
  });

  it("calls onEdit with task when 'Chỉnh sửa' button is clicked", async () => {
    const user = userEvent.setup();
    const handleEdit = vi.fn();
    vi.mocked(tasksApi.getTask).mockResolvedValue(MOCK_TASK);

    render(
      <TaskDetailsModal
        taskId={42}
        onClose={vi.fn()}
        onEdit={handleEdit}
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Chỉnh sửa" }),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Chỉnh sửa" }));
    expect(handleEdit).toHaveBeenCalledWith(MOCK_TASK);
  });

  describe("duplicate GET remediation with initialTask", () => {
    it("renders immediately and skips getTask when matching initialTask is provided", () => {
      render(
        <TaskDetailsModal
          taskId={42}
          initialTask={MOCK_TASK}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />,
      );

      expect(tasksApi.getTask).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "Hoàn thiện báo cáo quý" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Đang làm")).toBeInTheDocument();
      expect(screen.getByText("Cao")).toBeInTheDocument();
    });

    it("fetches via getTask when initialTask id does not match taskId", async () => {
      vi.mocked(tasksApi.getTask).mockResolvedValue({
        ...MOCK_TASK,
        id: 99,
        title: "Công việc khác",
      });

      render(
        <TaskDetailsModal
          taskId={99}
          initialTask={MOCK_TASK} // id 42 !== 99
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />,
      );

      expect(tasksApi.getTask).toHaveBeenCalledWith(99, expect.any(AbortSignal));

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Công việc khác" }),
        ).toBeInTheDocument();
      });
    });

    it("fetches fresh data from server on retry even if initialTask was provided", async () => {
      const user = userEvent.setup();
      vi.mocked(tasksApi.getTask).mockResolvedValue({
        ...MOCK_TASK,
        title: "Báo cáo đã cập nhật trên server",
      });

      const { rerender } = render(
        <TaskDetailsModal
          taskId={42}
          initialTask={MOCK_TASK}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />,
      );

      expect(tasksApi.getTask).not.toHaveBeenCalled();
      expect(
        screen.getByRole("heading", { name: "Hoàn thiện báo cáo quý" }),
      ).toBeInTheDocument();

      // Simulate a network failure during background retry or subsequent error
      vi.mocked(tasksApi.getTask)
        .mockRejectedValueOnce(new ApiError("Server error", { status: 500 }))
        .mockResolvedValueOnce({
          ...MOCK_TASK,
          title: "Báo cáo đã cập nhật trên server",
        });

      // Force an error via changing taskId to something that fails, then retry
      rerender(
        <TaskDetailsModal
          taskId={99}
          onClose={vi.fn()}
          onEdit={vi.fn()}
        />,
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      const retryBtn = screen.getByRole("button", { name: "Thử lại" });
      await user.click(retryBtn);

      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: "Báo cáo đã cập nhật trên server" }),
        ).toBeInTheDocument();
      });
      expect(tasksApi.getTask).toHaveBeenCalledWith(99, expect.any(AbortSignal));
    });
  });
});
