import { MemoryRouter } from "react-router";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardPage } from "./DashboardPage";
import { formatDateTime } from "../lib/date";
import { ApiError } from "../lib/api-errors";
import type { DashboardStatsResponse } from "../types/dashboard";
import type { UseDashboardStatsResult } from "../hooks/useDashboardStats";

const { useDashboardStatsMock } = vi.hoisted(() => ({
  useDashboardStatsMock: vi.fn(),
}));

vi.mock("../hooks/useDashboardStats", () => ({
  useDashboardStats: useDashboardStatsMock,
}));

const refetchMock = vi.fn();

const EMPTY_STATS: DashboardStatsResponse = {
  total_tasks: 0,
  completed_tasks: 0,
  in_progress_tasks: 0,
  todo_tasks: 0,
  upcoming_deadlines: [],
};

const STATS: DashboardStatsResponse = {
  total_tasks: 6,
  completed_tasks: 1,
  in_progress_tasks: 3,
  todo_tasks: 2,
  upcoming_deadlines: [],
};

function mockResult(result: Partial<UseDashboardStatsResult>) {
  useDashboardStatsMock.mockReturnValue({
    data: null,
    isLoading: false,
    error: null,
    refetch: refetchMock,
    ...result,
  } satisfies UseDashboardStatsResult);
}

function renderDashboard() {
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <DashboardPage />
    </MemoryRouter>,
  );
}

function deadline(
  id: number,
  overrides: Partial<DashboardStatsResponse["upcoming_deadlines"][number]> = {},
): DashboardStatsResponse["upcoming_deadlines"][number] {
  return {
    id,
    title: `Công việc ${id}`,
    status: "TODO",
    priority: "MEDIUM",
    due_date: "2026-11-20T09:00:00Z",
    ...overrides,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    refetchMock.mockClear();
    mockResult({ data: STATS });
  });

  it("renders backend metrics and the derived completion percentage", () => {
    renderDashboard();

    const metrics = screen.getByRole("region", {
      name: "Tổng quan công việc",
    });

    expect(within(metrics).getByText("6")).toBeInTheDocument();
    expect(within(metrics).getAllByText("Cần làm").length).toBeGreaterThan(0);
    expect(
      within(metrics).getAllByText("Đang làm").length,
    ).toBeGreaterThan(0);
    expect(
      within(metrics).getAllByText("Hoàn thành").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getByRole("progressbar", {
        name: "Tỉ lệ hoàn thành: 17%",
      }),
    ).toHaveAttribute("aria-valuenow", "17");

    expect(
      screen.getByRole("img", {
        name: "Phân bổ trạng thái: 2 cần làm, 3 đang làm, 1 hoàn thành.",
      }),
    ).toBeInTheDocument();
  });

  it("avoids division by zero for an empty account", () => {
    mockResult({ data: EMPTY_STATS });
    renderDashboard();

    expect(
      screen.getByRole("progressbar", {
        name: "Tỉ lệ hoàn thành: 0%",
      }),
    ).toHaveAttribute("aria-valuenow", "0");
    expect(
      screen.getByRole("heading", {
        name: "Không gian công việc của bạn đang trống.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/NaN|Infinity/)).not.toBeInTheDocument();
  });

  it("links an empty account to the task workspace without claiming creation exists", () => {
    mockResult({ data: EMPTY_STATS });
    renderDashboard();

    expect(
      screen.getByRole("link", { name: "Đến khu vực công việc" }),
    ).toHaveAttribute("href", "/tasks");
    expect(
      screen.queryByRole("link", { name: /Tạo công việc mới/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps metrics visible when tasks exist but no deadlines are upcoming", () => {
    mockResult({
      data: {
        ...STATS,
        upcoming_deadlines: [],
      },
    });
    renderDashboard();

    expect(
      screen.getByRole("progressbar", {
        name: "Tỉ lệ hoàn thành: 17%",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Không có công việc nào sắp đến hạn."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Không gian công việc của bạn đang trống.",
      }),
    ).not.toBeInTheDocument();
  });

  it("displays at most five upcoming deadlines", () => {
    mockResult({
      data: {
        ...STATS,
        upcoming_deadlines: [
          deadline(1),
          deadline(2),
          deadline(3),
          deadline(4),
          deadline(5),
          deadline(6),
        ],
      },
    });
    renderDashboard();

    expect(screen.getByText("Công việc 1")).toBeInTheDocument();
    expect(screen.getByText("Công việc 5")).toBeInTheDocument();
    expect(screen.queryByText("Công việc 6")).not.toBeInTheDocument();
  });

  it("renders Vietnamese priority and status labels from raw enum values", () => {
    mockResult({
      data: {
        ...STATS,
        upcoming_deadlines: [
          deadline(1, {
            status: "TODO",
            priority: "HIGH",
          }),
          deadline(2, {
            status: "IN_PROGRESS",
            priority: "MEDIUM",
          }),
          deadline(3, {
            status: "DONE",
            priority: "LOW",
          }),
        ],
      },
    });
    renderDashboard();

    expect(screen.getAllByText("Cao").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Trung bình").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Thấp").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Cần làm").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đang làm").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Hoàn thành").length).toBeGreaterThan(0);
  });

  it("renders deadline timestamps in the browser's local timezone", () => {
    const dueDate = "2026-11-20T09:00:00Z";
    mockResult({
      data: {
        ...STATS,
        upcoming_deadlines: [deadline(105, { due_date: dueDate })],
      },
    });
    renderDashboard();

    expect(
      screen.getByText(formatDateTime(dueDate, "vi-VN")),
    ).toBeInTheDocument();
    expect(screen.queryByText(dueDate)).not.toBeInTheDocument();
  });

  it("links deadline rows to the task workspace with the task id preserved", () => {
    mockResult({
      data: {
        ...STATS,
        upcoming_deadlines: [
          deadline(105, { title: "Nộp báo cáo thử việc" }),
        ],
      },
    });
    renderDashboard();

    expect(
      screen.getByRole("link", { name: "Nộp báo cáo thử việc" }),
    ).toHaveAttribute("href", "/tasks?highlight=105");
  });

  it("shows an actionable network error without exposing raw failures", async () => {
    const user = userEvent.setup();

    mockResult({
      isLoading: false,
      error: new ApiError("Raw backend failure", {
        isNetworkError: true,
      }),
    });
    renderDashboard();

    expect(
      screen.getByRole("heading", {
        name: "Không thể tải bảng điều khiển.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("Raw backend failure")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Thử lại tải bảng điều khiển",
      }),
    );

    expect(refetchMock).toHaveBeenCalledTimes(1);
  });

  it("announces the loading state and keeps the final layout dimensions", () => {
    mockResult({ isLoading: true });
    renderDashboard();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Đang tải thông tin bảng điều khiển.",
    );
    expect(
      screen.getByLabelText("Đang tải bảng điều khiển"),
    ).toHaveAttribute("aria-busy", "true");
  });
});
