import { ListChecks, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import type { ApiError } from "../../lib/api-errors";
import type { Task, TaskStatus } from "../../types/task";
import { Button } from "../ui/Button";
import { TaskItemRow } from "./TaskItemRow";

interface TaskListProps {
  items: Task[];
  isLoading: boolean;
  error: ApiError | null;
  hasActiveFilters: boolean;
  updatingStatusTaskId?: number | null;
  highlightedTaskId?: number | null;
  onClearFilters: () => void;
  onRetry: () => void;
  onViewDetails?: (task: Task) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onStatusChange?: (task: Task, nextStatus: TaskStatus) => Promise<void>;
  onCreateTask?: () => void;
}

const PULSE = "motion-safe:animate-pulse";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block rounded-lg bg-slate-200/80 ${PULSE} ${className}`}
    />
  );
}

function TaskListSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Đang tải danh sách công việc"
      className="grid gap-3"
    >
      <p role="status" className="sr-only">
        Đang tải danh sách công việc.
      </p>

      {[0, 1, 2, 3].map((item) => (
        <div
          key={item}
          aria-hidden="true"
          className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5"
        >
          <SkeletonBlock className="h-4 w-[min(28rem,70%)]" />
          <SkeletonBlock className="mt-2.5 h-3 w-[min(22rem,55%)]" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SkeletonBlock className="h-5 w-20" />
            <SkeletonBlock className="h-5 w-16" />
            <SkeletonBlock className="h-5 w-28" />
            <SkeletonBlock className="h-5 w-24" />
          </div>
        </div>
      ))}
    </section>
  );
}

function TaskListMessage({
  tone,
  title,
  description,
  action,
  alert = false,
}: {
  tone: "neutral" | "danger";
  title: string;
  description: string;
  action?: ReactNode;
  alert?: boolean;
}) {
  const Icon = tone === "danger" ? TriangleAlert : ListChecks;

  return (
    <section
      role={alert ? "alert" : undefined}
      aria-labelledby="task-list-message-heading"
      className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-xs"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${
          tone === "danger" ? "bg-danger" : "bg-accent"
        }`}
      />

      <div className="max-w-2xl p-6 sm:p-8">
        <span
          className={`grid size-11 place-items-center rounded-xl border ${
            tone === "danger"
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-orange-200 bg-orange-50 text-accent shadow-xs"
          }`}
        >
          <Icon aria-hidden="true" className="size-5" />
        </span>

        <h2
          id="task-list-message-heading"
          className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-ink"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>

        {action ? <div className="mt-6">{action}</div> : null}
      </div>
    </section>
  );
}

export function TaskList({
  items,
  isLoading,
  error,
  hasActiveFilters,
  updatingStatusTaskId,
  highlightedTaskId,
  onClearFilters,
  onRetry,
  onViewDetails,
  onEdit,
  onDelete,
  onStatusChange,
  onCreateTask,
}: TaskListProps) {
  if (isLoading) {
    return <TaskListSkeleton />;
  }

  if (error) {
    return (
      <TaskListMessage
        tone="danger"
        alert
        title="Không thể tải danh sách công việc."
        description={
          error.isNetworkError
            ? "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại."
            : "Đã xảy ra lỗi khi tải danh sách công việc. Vui lòng thử lại."
        }
        action={
          <Button variant="secondary" onClick={onRetry}>
            Thử lại
          </Button>
        }
      />
    );
  }

  if (items.length === 0) {
    return hasActiveFilters ? (
      <TaskListMessage
        tone="neutral"
        title="Không tìm thấy công việc phù hợp."
        description="Thử từ khóa khác hoặc xóa bộ lọc để xem toàn bộ danh sách."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Xóa bộ lọc
          </Button>
        }
      />
    ) : (
      <TaskListMessage
        tone="neutral"
        title="Bạn chưa có công việc nào."
        description="Công việc của bạn sẽ xuất hiện ở đây khi bạn bắt đầu quản lý."
        action={
          onCreateTask ? (
            <Button onClick={onCreateTask}>
              Tạo công việc
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <section
      aria-labelledby="task-list-heading"
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs"
    >
      <h2 id="task-list-heading" className="sr-only">
        Danh sách công việc
      </h2>

      <table className="block w-full border-collapse md:table">
        <caption className="sr-only">
          Danh sách công việc với trạng thái, mức ưu tiên, hạn chót và thời
          điểm cập nhật.
        </caption>

        <thead className="hidden md:table-header-group">
          <tr className="border-b border-line bg-surface-subtle/80">
            <th
              scope="col"
              className="px-5 py-3.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Công việc
            </th>
            <th
              scope="col"
              className="w-32 px-5 py-3.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Trạng thái
            </th>
            <th
              scope="col"
              className="w-28 px-5 py-3.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Ưu tiên
            </th>
            <th
              scope="col"
              className="w-36 px-5 py-3.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Hạn chót
            </th>
            <th
              scope="col"
              className="w-36 px-5 py-3.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Cập nhật
            </th>
            <th
              scope="col"
              className="w-64 px-5 py-3.5 text-right font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody className="grid gap-3 p-3 md:table-row-group md:p-0 md:divide-y md:divide-line">
          {items.map((task) => (
            <TaskItemRow
              key={task.id}
              task={task}
              isUpdatingStatus={updatingStatusTaskId === task.id}
              isHighlighted={highlightedTaskId === task.id}
              onViewDetails={onViewDetails}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
            />
          ))}
        </tbody>
      </table>
    </section>
  );
}
