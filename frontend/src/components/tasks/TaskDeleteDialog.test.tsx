import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../lib/api-errors";
import type { Task } from "../../types/task";
import { TaskDeleteDialog } from "./TaskDeleteDialog";

const MOCK_TASK: Task = {
  id: 42,
  user_id: 1,
  title: "Tài liệu đào tạo nhân viên",
  description: "Chuẩn bị giáo trình",
  status: "TODO",
  priority: "MEDIUM",
  due_date: null,
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-05T10:00:00Z",
};

describe("TaskDeleteDialog", () => {
  it("renders task name and destructive warning", () => {
    render(
      <TaskDeleteDialog
        task={MOCK_TASK}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Xóa công việc này?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tài liệu đào tạo nhân viên/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Hành động này không thể hoàn tác/),
    ).toBeInTheDocument();
  });

  it("does not call onConfirm when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleConfirm = vi.fn();

    render(
      <TaskDeleteDialog
        task={MOCK_TASK}
        isDeleting={false}
        onClose={handleClose}
        onConfirm={handleConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Hủy" }));

    expect(handleClose).toHaveBeenCalledTimes(1);
    expect(handleConfirm).not.toHaveBeenCalled();
  });

  it("calls onConfirm when Xóa button is confirmed", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskDeleteDialog
        task={MOCK_TASK}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Xóa" }));

    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables actions and indicates pending state when isDeleting is true", () => {
    render(
      <TaskDeleteDialog
        task={MOCK_TASK}
        isDeleting={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Xóa/ })).toBeDisabled();
  });

  it("prevents double submission while confirmation is in progress", async () => {
    const user = userEvent.setup();
    let resolveDelete: () => void = () => {};
    const deletePromise = new Promise<void>((resolve) => {
      resolveDelete = resolve;
    });

    const handleConfirm = vi.fn().mockReturnValue(deletePromise);

    render(
      <TaskDeleteDialog
        task={MOCK_TASK}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    const deleteBtn = screen.getByRole("button", { name: "Xóa" });
    await user.click(deleteBtn);
    await user.click(deleteBtn);

    expect(handleConfirm).toHaveBeenCalledTimes(1);

    resolveDelete();
  });

  it("displays safe error message when deletion fails", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn().mockRejectedValue(
      new ApiError("Server error", { isNetworkError: true }),
    );

    render(
      <TaskDeleteDialog
        task={MOCK_TASK}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.",
      );
    });
  });

  it("displays 404 message when task was already deleted", async () => {
    const user = userEvent.setup();
    const handleConfirm = vi.fn().mockRejectedValue(
      new ApiError("Not found", { status: 404 }),
    );

    render(
      <TaskDeleteDialog
        task={MOCK_TASK}
        isDeleting={false}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Xóa" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Công việc không còn tồn tại hoặc đã bị xóa.",
      );
    });
  });
});

