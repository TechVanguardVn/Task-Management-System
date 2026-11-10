import { Calendar, ChevronDown } from "lucide-react";
import type { DragEvent } from "react";

import { formatDate, parseApiDate } from "../../lib/date";
import { cn } from "../../lib/utils";
import type { Task, TaskPriority, TaskStatus } from "../../types/task";
import { Badge } from "../ui/Badge";
import { Spinner } from "../ui/Spinner";

export interface KanbanCardProps {
  task: Task;
  isUpdating?: boolean;
  onMoveStatus: (taskId: number, targetStatus: TaskStatus) => void;
  onDragStart?: (taskId: number) => void;
  onDragEnd?: () => void;
}

const PRIORITY_PRESENTATION: Record<
  TaskPriority,
  { label: string; tone: "low" | "medium" | "high" }
> = {
  HIGH: { label: "Cao", tone: "high" },
  MEDIUM: { label: "Trung bình", tone: "medium" },
  LOW: { label: "Thấp", tone: "low" },
};

function checkIsOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === "DONE") {
    return false;
  }

  const parsed = parseApiDate(dueDate);
  if (!parsed) {
    return false;
  }

  return parsed.getTime() < Date.now();
}

export function KanbanCard({
  task,
  isUpdating = false,
  onMoveStatus,
  onDragStart,
  onDragEnd,
}: KanbanCardProps) {
  const priority = PRIORITY_PRESENTATION[task.priority];
  const isOverdue = checkIsOverdue(task.due_date, task.status);

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    if (isUpdating) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData("text/plain", String(task.id));
    event.dataTransfer.effectAllowed = "move";
    onDragStart?.(task.id);
  }

  function handleDragEnd() {
    onDragEnd?.();
  }

  function handleQuickMove(nextStatus: TaskStatus) {
    if (nextStatus === task.status || isUpdating) {
      return;
    }

    onMoveStatus(task.id, nextStatus);
  }

  return (
    <div
      role="article"
      aria-labelledby={`task-card-title-${task.id}`}
      draggable={!isUpdating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={cn(
        "group relative rounded-xl border border-line bg-surface p-4 shadow-xs transition-all",
        !isUpdating
          ? "cursor-grab hover:border-line-strong hover:shadow-sm active:cursor-grabbing"
          : "cursor-not-allowed opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4
          id={`task-card-title-${task.id}`}
          className="break-words text-sm font-semibold leading-5 text-ink"
        >
          {task.title}
        </h4>
      </div>

      {task.description ? (
        <p className="mt-1.5 break-words text-xs leading-5 text-muted line-clamp-2">
          {task.description}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={priority.tone}>{priority.label}</Badge>

        {isOverdue ? (
          <span className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-red-700">
            Quá hạn
          </span>
        ) : null}

        {task.due_date ? (
          <div className="ml-auto flex items-center gap-1 text-xs text-muted">
            <Calendar aria-hidden="true" className="size-3.5 shrink-0" />
            <time dateTime={task.due_date}>
              {formatDate(task.due_date, "vi-VN", "Chưa đặt hạn")}
            </time>
          </div>
        ) : null}
      </div>

      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-line/60 pt-3">
        <label
          htmlFor={`quick-move-${task.id}`}
          className="text-[11px] font-medium text-muted"
        >
          Chuyển sang:
        </label>

        <div className="relative inline-flex items-center">
          <select
            id={`quick-move-${task.id}`}
            aria-label={`Di chuyển trạng thái công việc ${task.title}`}
            value={task.status}
            disabled={isUpdating}
            aria-busy={isUpdating || undefined}
            onChange={(e) => handleQuickMove(e.target.value as TaskStatus)}
            className="h-7 appearance-none rounded-lg border border-line bg-surface pl-2 pr-6 text-[11px] font-medium text-ink shadow-xs transition-colors hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-55"
          >
            <option value="TODO">Cần làm</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="DONE">Hoàn thành</option>
          </select>

          {isUpdating ? (
            <span className="pointer-events-none absolute right-1.5 inline-flex items-center">
              <Spinner
                size="sm"
                className="size-3 text-muted"
                label="Đang cập nhật"
              />
            </span>
          ) : (
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-1.5 size-3 text-muted"
            />
          )}
        </div>
      </div>
    </div>
  );
}
