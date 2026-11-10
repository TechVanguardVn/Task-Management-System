import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../lib/api-errors";
import { localInputToUtcIso, utcIsoToLocalInput } from "../../lib/date";
import type { Task } from "../../types/task";
import { TaskFormModal } from "./TaskFormModal";

const MOCK_TASK: Task = {
  id: 42,
  user_id: 1,
  title: "Soạn thảo tài liệu",
  description: "Mô tả chi tiết công việc",
  status: "IN_PROGRESS",
  priority: "HIGH",
  due_date: "2026-11-20T09:00:00Z",
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-05T10:00:00Z",
};

describe("TaskFormModal", () => {
  it("renders create mode with default values", () => {
    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Tạo công việc" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tiêu đề")).toHaveValue("");
    expect(screen.getByLabelText("Mô tả")).toHaveValue("");
    expect(screen.getByLabelText("Trạng thái")).toHaveValue("TODO");
    expect(screen.getByLabelText("Mức ưu tiên")).toHaveValue("MEDIUM");
    expect(screen.getByLabelText("Hạn chót")).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Tạo công việc" }),
    ).toBeInTheDocument();
  });

  it("renders edit mode with prefilled values from task", () => {
    render(
      <TaskFormModal
        mode="edit"
        task={MOCK_TASK}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Chỉnh sửa công việc" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Tiêu đề")).toHaveValue(MOCK_TASK.title);
    expect(screen.getByLabelText("Mô tả")).toHaveValue(MOCK_TASK.description);
    expect(screen.getByLabelText("Trạng thái")).toHaveValue(MOCK_TASK.status);
    expect(screen.getByLabelText("Mức ưu tiên")).toHaveValue(MOCK_TASK.priority);
    expect(screen.getByLabelText("Hạn chót")).toHaveValue(
      utcIsoToLocalInput(MOCK_TASK.due_date),
    );
    expect(
      screen.getByRole("button", { name: "Lưu thay đổi" }),
    ).toBeInTheDocument();
  });

  it("validates required title and rejects whitespace-only title", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

    expect(
      screen.getByText("Vui lòng nhập tiêu đề công việc."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    // Whitespace only
    await user.type(screen.getByLabelText("Tiêu đề"), "     ");
    await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

    expect(
      screen.getByText("Vui lòng nhập tiêu đề công việc."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("validates title max length of 200 characters", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    const input = screen.getByLabelText("Tiêu đề");
    fireEvent.change(input, { target: { value: "A".repeat(201) } });

    await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

    expect(
      screen.getByText("Tiêu đề không được vượt quá 200 ký tự."),
    ).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });

  it("submits valid create payload with exact contract and without read-only fields", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Tiêu đề"), "Họp phòng ban");
    await user.type(screen.getByLabelText("Mô tả"), "Chuẩn bị slide");
    await user.selectOptions(screen.getByLabelText("Trạng thái"), "IN_PROGRESS");
    await user.selectOptions(screen.getByLabelText("Mức ưu tiên"), "HIGH");

    await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0]![0];

    expect(payload).toEqual({
      title: "Họp phòng ban",
      description: "Chuẩn bị slide",
      status: "IN_PROGRESS",
      priority: "HIGH",
      due_date: null,
    });

    // Ensure no read-only fields are included
    expect(payload).not.toHaveProperty("id");
    expect(payload).not.toHaveProperty("user_id");
    expect(payload).not.toHaveProperty("created_at");
    expect(payload).not.toHaveProperty("updated_at");
  });

  it("submits full 5 fields with null description and null due_date on edit", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskFormModal
        mode="edit"
        task={MOCK_TASK}
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    // Clear description and due date
    await user.clear(screen.getByLabelText("Mô tả"));
    await user.clear(screen.getByLabelText("Hạn chót"));

    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0]![0];

    expect(payload).toEqual({
      title: MOCK_TASK.title,
      description: null,
      status: MOCK_TASK.status,
      priority: MOCK_TASK.priority,
      due_date: null,
    });
  });

  it("converts datetime-local to UTC ISO format with Z", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Tiêu đề"), "Task có hạn");
    const testLocalInput = "2026-11-20T10:00";
    await user.type(screen.getByLabelText("Hạn chót"), testLocalInput);

    await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

    expect(handleSubmit).toHaveBeenCalledTimes(1);
    const payload = handleSubmit.mock.calls[0]![0];

    expect(payload.due_date).toBe(localInputToUtcIso(testLocalInput));
    expect(payload.due_date).toMatch(/Z$/);
  });

  it("maps 422 fieldErrors from ApiError to inline error messages", async () => {
    const user = userEvent.setup();
    const validationError = new ApiError("Validation error", {
      status: 422,
      fieldErrors: {
        title: "Tiêu đề đã tồn tại.",
        due_date: "Hạn chót phải trong tương lai.",
      },
    });

    const handleSubmit = vi.fn().mockRejectedValue(validationError);

    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Tiêu đề"), "Tên trùng");
    await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

    await waitFor(() => {
      expect(screen.getByText("Tiêu đề đã tồn tại.")).toBeInTheDocument();
      expect(
        screen.getByText("Hạn chót phải trong tương lai."),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Vui lòng kiểm tra các trường được đánh dấu."),
      ).toBeInTheDocument();
    });
  });

  it("prevents double submission while submitting", async () => {
    const user = userEvent.setup();
    let resolveSubmit: () => void = () => {};
    const submitPromise = new Promise<void>((resolve) => {
      resolveSubmit = resolve;
    });

    const handleSubmit = vi.fn().mockReturnValue(submitPromise);

    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Tiêu đề"), "Đang gửi");
    const submitBtn = screen.getByRole("button", { name: "Tạo công việc" });

    await user.click(submitBtn);
    await user.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalledTimes(1);

    resolveSubmit();
  });

  it("disables inputs and buttons when isSubmitting is true", () => {
    render(
      <TaskFormModal
        mode="create"
        isSubmitting={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Tiêu đề")).toBeDisabled();
    expect(screen.getByLabelText("Mô tả")).toBeDisabled();
    expect(screen.getByLabelText("Trạng thái")).toBeDisabled();
    expect(screen.getByLabelText("Mức ưu tiên")).toBeDisabled();
    expect(screen.getByLabelText("Hạn chót")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Hủy" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Tạo công việc/ })).toBeDisabled();
  });

  it("keeps the modal open on submission failure without calling onClose", async () => {
    const user = userEvent.setup();
    const handleClose = vi.fn();
    const handleSubmit = vi.fn().mockRejectedValue(new Error("Network failed"));

    render(
      <TaskFormModal
        mode="create"
        isSubmitting={false}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );

    await user.type(screen.getByLabelText("Tiêu đề"), "Thử gửi lỗi");
    await user.click(screen.getByRole("button", { name: "Tạo công việc" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Tạo công việc" }),
      ).toBeInTheDocument();
    });

    expect(handleClose).not.toHaveBeenCalled();
  });
});
