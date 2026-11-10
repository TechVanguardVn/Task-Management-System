import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Task } from "../../types/task";
import { TaskItemRow } from "./TaskItemRow";

const MOCK_TASK: Task = {
  id: 42,
  user_id: 1,
  title: "Đánh giá hiệu suất",
  description: "Chuẩn bị biên bản họp",
  status: "TODO",
  priority: "HIGH",
  due_date: "2026-11-20T17:00:00Z",
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-05T10:00:00Z",
};

function renderRow(props: Partial<Parameters<typeof TaskItemRow>[0]> = {}) {
  return render(
    <table>
      <tbody>
        <TaskItemRow
          task={MOCK_TASK}
          onViewDetails={vi.fn()}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onStatusChange={vi.fn()}
          {...props}
        />
      </tbody>
    </table>,
  );
}

describe("TaskItemRow", () => {
  it("renders task information, status badge, priority badge, and all action buttons", () => {
    renderRow();

    expect(screen.getByText("Đánh giá hiệu suất")).toBeInTheDocument();
    expect(screen.getByText("Chuẩn bị biên bản họp")).toBeInTheDocument();
    expect(screen.getByText("Cao")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: 'Xem chi tiết "Đánh giá hiệu suất"' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: 'Chỉnh sửa "Đánh giá hiệu suất"' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: 'Xóa "Đánh giá hiệu suất"' }),
    ).toBeInTheDocument();

    const select = screen.getByLabelText('Đổi trạng thái cho "Đánh giá hiệu suất"');
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue("TODO");
  });

  it("has all valid status options in the quick status select", () => {
    renderRow();

    const select = screen.getByLabelText('Đổi trạng thái cho "Đánh giá hiệu suất"');
    const options = Array.from(select.querySelectorAll("option")).map(
      (opt) => ({ value: opt.value, text: opt.textContent }),
    );

    expect(options).toEqual([
      { value: "TODO", text: "Cần làm" },
      { value: "IN_PROGRESS", text: "Đang làm" },
      { value: "DONE", text: "Hoàn thành" },
    ]);
  });

  it("calls onStatusChange with task and new status when selected", async () => {
    const user = userEvent.setup();
    const handleStatusChange = vi.fn().mockResolvedValue(undefined);

    renderRow({ onStatusChange: handleStatusChange });

    const select = screen.getByLabelText('Đổi trạng thái cho "Đánh giá hiệu suất"');
    await user.selectOptions(select, "IN_PROGRESS");

    expect(handleStatusChange).toHaveBeenCalledWith(MOCK_TASK, "IN_PROGRESS");
  });

  it("rolls back to previous status if onStatusChange fails", async () => {
    const user = userEvent.setup();
    const handleStatusChange = vi.fn().mockRejectedValue(new Error("Update failed"));

    renderRow({ onStatusChange: handleStatusChange });

    const select = screen.getByLabelText('Đổi trạng thái cho "Đánh giá hiệu suất"');
    await user.selectOptions(select, "DONE");

    await waitFor(() => {
      expect(select).toHaveValue("TODO");
    });
  });

  it("shows loading spinner and disables select when isUpdatingStatus is true", () => {
    renderRow({ isUpdatingStatus: true });

    const select = screen.getByLabelText('Đổi trạng thái cho "Đánh giá hiệu suất"');
    expect(select).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent("Đang cập nhật");
  });

  it("triggers onViewDetails, onEdit, and onDelete callbacks", async () => {
    const user = userEvent.setup();
    const handleView = vi.fn();
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();

    renderRow({
      onViewDetails: handleView,
      onEdit: handleEdit,
      onDelete: handleDelete,
    });

    await user.click(
      screen.getByRole("button", { name: 'Xem chi tiết "Đánh giá hiệu suất"' }),
    );
    expect(handleView).toHaveBeenCalledWith(MOCK_TASK);

    await user.click(
      screen.getByRole("button", { name: 'Chỉnh sửa "Đánh giá hiệu suất"' }),
    );
    expect(handleEdit).toHaveBeenCalledWith(MOCK_TASK);

    await user.click(
      screen.getByRole("button", { name: 'Xóa "Đánh giá hiệu suất"' }),
    );
    expect(handleDelete).toHaveBeenCalledWith(MOCK_TASK);
  });
});

