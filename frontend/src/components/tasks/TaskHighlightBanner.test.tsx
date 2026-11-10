import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Task } from "../../types/task";
import { parseHighlightTaskId } from "../../lib/highlight";
import { TaskHighlightBanner } from "./TaskHighlightBanner";

const MOCK_TASK: Task = {
  id: 102,
  user_id: 1,
  title: "Báo cáo thử việc đợt 2",
  description: "Hoàn thiện các đầu việc được giao",
  status: "IN_PROGRESS",
  priority: "HIGH",
  due_date: "2026-11-20T17:00:00Z",
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-05T10:00:00Z",
};

describe("parseHighlightTaskId", () => {
  it("parses valid positive integer strings into numbers", () => {
    expect(parseHighlightTaskId("1")).toBe(1);
    expect(parseHighlightTaskId("42")).toBe(42);
    expect(parseHighlightTaskId("102")).toBe(102);
    expect(parseHighlightTaskId("  999  ")).toBe(999);
  });

  it("returns null for null, undefined, empty, or whitespace strings", () => {
    expect(parseHighlightTaskId(null)).toBeNull();
    expect(parseHighlightTaskId("")).toBeNull();
    expect(parseHighlightTaskId("   ")).toBeNull();
  });

  it("rejects non-numeric alphabetic strings", () => {
    expect(parseHighlightTaskId("abc")).toBeNull();
    expect(parseHighlightTaskId("task42")).toBeNull();
    expect(parseHighlightTaskId("42a")).toBeNull();
  });

  it("rejects zero and negative numbers", () => {
    expect(parseHighlightTaskId("0")).toBeNull();
    expect(parseHighlightTaskId("-1")).toBeNull();
    expect(parseHighlightTaskId("-42")).toBeNull();
  });

  it("rejects decimal numbers", () => {
    expect(parseHighlightTaskId("1.5")).toBeNull();
    expect(parseHighlightTaskId("0.1")).toBeNull();
    expect(parseHighlightTaskId("42.0")).toBeNull();
  });

  it("rejects numbers exceeding MAX_SAFE_INTEGER", () => {
    expect(parseHighlightTaskId("9007199254740992")).toBeNull();
    expect(parseHighlightTaskId("99999999999999999999999")).toBeNull();
  });

  it("rejects exponential notation or leading zeros", () => {
    expect(parseHighlightTaskId("1e5")).toBeNull();
    expect(parseHighlightTaskId("012")).toBeNull();
  });
});

describe("TaskHighlightBanner", () => {
  it("renders found state with task title and 'Xem chi tiết' button", async () => {
    const user = userEvent.setup();
    const handleOpenDetails = vi.fn();
    const handleDismiss = vi.fn();

    render(
      <TaskHighlightBanner
        state={{ type: "found", task: MOCK_TASK }}
        onOpenDetails={handleOpenDetails}
        onDismiss={handleDismiss}
      />,
    );

    const banner = screen.getByRole("status");
    expect(banner).toBeInTheDocument();
    expect(screen.getByText(/"Báo cáo thử việc đợt 2"/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Công việc này hiện không nằm trong danh sách đang hiển thị/,
      ),
    ).toBeInTheDocument();

    // Does not expose user_id
    expect(screen.queryByText("user_id")).not.toBeInTheDocument();

    const openBtn = screen.getByRole("button", { name: /Xem chi tiết/ });
    await user.click(openBtn);
    expect(handleOpenDetails).toHaveBeenCalledWith(102);

    const closeBtn = screen.getByRole("button", {
      name: "Đóng thông báo liên kết",
    });
    await user.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders 404 not found state with alert semantics", async () => {
    const user = userEvent.setup();
    const handleDismiss = vi.fn();

    render(
      <TaskHighlightBanner
        state={{ type: "not_found" }}
        onDismiss={handleDismiss}
      />,
    );

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(
      screen.getByText("Công việc này không tồn tại hoặc đã bị xóa."),
    ).toBeInTheDocument();

    const closeBtn = screen.getByRole("button", {
      name: "Đóng thông báo liên kết",
    });
    await user.click(closeBtn);
    expect(handleDismiss).toHaveBeenCalledTimes(1);
  });

  it("renders error state with retry button and loading state", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();
    const handleDismiss = vi.fn();

    const { rerender } = render(
      <TaskHighlightBanner
        state={{
          type: "error",
          message: "Lỗi kết nối máy chủ.",
          isRetrying: false,
        }}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />,
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Lỗi kết nối máy chủ.")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Thử lại" });
    await user.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);

    // Re-render in retrying state
    rerender(
      <TaskHighlightBanner
        state={{
          type: "error",
          message: "Lỗi kết nối máy chủ.",
          isRetrying: true,
        }}
        onRetry={handleRetry}
        onDismiss={handleDismiss}
      />,
    );

    expect(screen.getByRole("button", { name: /Thử lại/ })).toBeDisabled();
  });
});
