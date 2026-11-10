import {
  AlertTriangle,
  ChevronDown,
  Info,
  RotateCw,
  Search,
  X,
} from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";

import { useKanbanTasks } from "../../hooks/useKanbanTasks";
import type { TaskPriority, TaskStatus } from "../../types/task";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { KanbanColumn } from "./KanbanColumn";

const PRIORITY_OPTIONS: ReadonlyArray<{
  value: TaskPriority;
  label: string;
}> = [
  { value: "HIGH", label: "Cao" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "LOW", label: "Thấp" },
];

interface PriorityFilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

function PriorityFilterSelect({
  label,
  value,
  onChange,
  children,
}: PriorityFilterSelectProps) {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-line bg-surface px-3 pr-9 text-sm text-ink transition-colors duration-150 hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải bảng Kanban"
      className="grid grid-cols-1 gap-5 md:grid-cols-3 lg:gap-6"
    >
      {[0, 1, 2].map((colIndex) => (
        <div
          key={colIndex}
          className="flex flex-col rounded-2xl border border-line bg-surface-subtle/50 p-4 sm:p-5"
        >
          <div className="flex items-center justify-between pb-4">
            <span className="h-4 w-24 rounded-lg bg-slate-200/80 motion-safe:animate-pulse" />
            <span className="h-5 w-8 rounded-lg bg-slate-200/80 motion-safe:animate-pulse" />
          </div>
          <div className="flex flex-col gap-3">
            {[0, 1].map((cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-xl border border-line bg-surface p-4 shadow-xs"
              >
                <span className="block h-4 w-3/4 rounded-lg bg-slate-200/80 motion-safe:animate-pulse" />
                <span className="mt-2 block h-3 w-1/2 rounded-lg bg-slate-200/80 motion-safe:animate-pulse" />
                <div className="mt-4 flex items-center justify-between">
                  <span className="h-5 w-14 rounded-lg bg-slate-200/80 motion-safe:animate-pulse" />
                  <span className="h-4 w-20 rounded-lg bg-slate-200/80 motion-safe:animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function KanbanBoard() {
  const {
    todoTasks,
    inProgressTasks,
    doneTasks,
    totalTasks,
    hasExceededCap,
    isLoading,
    error,
    actionError,
    announcement,
    updatingTaskIds,
    search,
    priority,
    hasActiveFilters,
    setSearch,
    setPriority,
    clearFilters,
    refetch,
    dismissActionError,
    moveTaskStatus,
  } = useKanbanTasks();

  function handleDropTask(taskId: number, targetStatus: TaskStatus) {
    void moveTaskStatus(taskId, targetStatus);
  }

  return (
    <div className="grid gap-5">
      {/* Live announcement region for accessibility */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>

      {/* Filter Bar */}
      <section
        role="search"
        aria-label="Bộ lọc Kanban"
        className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5"
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_14rem_auto] md:items-end">
          <Input
            label="Tìm kiếm"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo tiêu đề hoặc mô tả"
            autoComplete="off"
            endAdornment={
              <Search
                aria-hidden="true"
                className="mr-2 size-4 text-muted"
              />
            }
          />

          <PriorityFilterSelect
            label="Mức ưu tiên"
            value={priority ?? ""}
            onChange={(value) =>
              setPriority(value ? (value as TaskPriority) : null)
            }
          >
            <option value="">Tất cả ưu tiên</option>
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </PriorityFilterSelect>

          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="w-full md:w-auto"
          >
            <X aria-hidden="true" className="size-4" />
            Xóa bộ lọc
          </Button>
        </div>
      </section>

      {/* 300-task cap exceeded notice */}
      {hasExceededCap ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-amber-700"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              Bảng Kanban hiện chỉ hiển thị tối đa 300 công việc (tổng cộng{" "}
              <strong className="font-semibold">{totalTasks}</strong> công
              việc).
            </p>
            <p className="mt-0.5 text-xs text-amber-800">
              Hãy dùng bộ lọc tìm kiếm hoặc mức ưu tiên ở trên để thu hẹp kết quả
              mong muốn.
            </p>
          </div>
        </div>
      ) : null}

      {/* Action error banner (e.g. failed PATCH rollback) */}
      {actionError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              aria-hidden="true"
              className="size-4 shrink-0 text-red-600"
            />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={dismissActionError}
            aria-label="Đóng thông báo lỗi"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-red-700 hover:bg-red-100"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {/* Loading state */}
      {isLoading ? <KanbanSkeleton /> : null}

      {/* Initial load error state */}
      {!isLoading && error ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-surface p-8 text-center shadow-xs"
        >
          <div className="grid size-12 place-items-center rounded-xl border border-red-200 bg-red-50 text-red-600">
            <AlertTriangle aria-hidden="true" className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink">
            Không thể tải bảng Kanban
          </h3>
          <p className="mt-1 max-w-md text-sm text-muted">
            {error.isNetworkError
              ? "Không thể kết nối tới máy chủ. Vui lòng kiểm tra kết nối mạng."
              : "Đã xảy ra lỗi khi tải danh sách công việc. Vui lòng thử lại."}
          </p>
          <Button variant="secondary" onClick={refetch} className="mt-5">
            <RotateCw aria-hidden="true" className="size-4" />
            Thử lại
          </Button>
        </div>
      ) : null}

      {/* Empty board state */}
      {!isLoading && !error && totalTasks === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-line bg-surface p-10 text-center shadow-xs">
          <p className="text-base font-semibold text-ink">
            {hasActiveFilters
              ? "Không tìm thấy công việc phù hợp."
              : "Bạn chưa có công việc nào."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {hasActiveFilters
              ? "Thử từ khóa khác hoặc xóa bộ lọc để hiển thị đầy đủ công việc."
              : "Các công việc sẽ hiển thị tại các cột tương ứng khi được tạo."}
          </p>
          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearFilters} className="mt-4">
              Xóa bộ lọc
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Kanban columns board */}
      {!isLoading && !error && totalTasks > 0 ? (
        <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-3 lg:gap-6">
          <KanbanColumn
            status="TODO"
            title="Cần làm"
            tasks={todoTasks}
            updatingTaskIds={updatingTaskIds}
            onMoveStatus={moveTaskStatus}
            onDropTask={handleDropTask}
          />
          <KanbanColumn
            status="IN_PROGRESS"
            title="Đang thực hiện"
            tasks={inProgressTasks}
            updatingTaskIds={updatingTaskIds}
            onMoveStatus={moveTaskStatus}
            onDropTask={handleDropTask}
          />
          <KanbanColumn
            status="DONE"
            title="Hoàn thành"
            tasks={doneTasks}
            updatingTaskIds={updatingTaskIds}
            onMoveStatus={moveTaskStatus}
            onDropTask={handleDropTask}
          />
        </div>
      ) : null}
    </div>
  );
}
