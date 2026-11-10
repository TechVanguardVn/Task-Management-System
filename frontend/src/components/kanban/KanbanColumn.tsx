import { useRef, useState } from "react";
import type { DragEvent } from "react";

import { cn } from "../../lib/utils";
import type { Task, TaskStatus } from "../../types/task";
import { KanbanCard } from "./KanbanCard";

export interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  tasks: Task[];
  updatingTaskIds: Set<number>;
  onMoveStatus: (taskId: number, targetStatus: TaskStatus) => void;
  onDropTask: (taskId: number, targetStatus: TaskStatus) => void;
  onDragStartCard?: (taskId: number) => void;
  onDragEndCard?: () => void;
}

const COLUMN_THEMES: Record<
  TaskStatus,
  { dot: string; countBadge: string }
> = {
  TODO: {
    dot: "bg-slate-500",
    countBadge: "border-slate-200 bg-slate-100 text-slate-700",
  },
  IN_PROGRESS: {
    dot: "bg-amber-500",
    countBadge: "border-amber-200 bg-amber-50 text-amber-800",
  },
  DONE: {
    dot: "bg-emerald-600",
    countBadge: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

export function KanbanColumn({
  status,
  title,
  tasks,
  updatingTaskIds,
  onMoveStatus,
  onDropTask,
  onDragStartCard,
  onDragEndCard,
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);
  const theme = COLUMN_THEMES[status];

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current += 1;
    setIsDragOver(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    dragCounter.current = 0;
    setIsDragOver(false);

    const rawId = event.dataTransfer.getData("text/plain");
    const taskId = Number(rawId);

    if (Number.isFinite(taskId) && taskId > 0) {
      onDropTask(taskId, status);
    }
  }

  return (
    <section
      role="region"
      aria-labelledby={`kanban-column-heading-${status}`}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col rounded-2xl border p-4 transition-all duration-200 sm:p-5",
        isDragOver
          ? "border-accent/60 bg-orange-50/50 ring-2 ring-accent/30"
          : "border-line bg-surface-subtle/50",
      )}
    >
      <header className="flex items-center justify-between gap-3 pb-4">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={cn("size-2 rounded-full", theme.dot)}
          />
          <h3
            id={`kanban-column-heading-${status}`}
            className="text-sm font-semibold tracking-[-0.01em] text-ink"
          >
            {title}
          </h3>
        </div>

        <span
          className={cn(
            "rounded-lg border px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums",
            theme.countBadge,
          )}
          aria-label={`${tasks.length} công việc`}
        >
          {tasks.length}
        </span>
      </header>

      <div className="flex flex-1 flex-col gap-3">
        {tasks.length === 0 ? (
          <div
            className={cn(
              "flex min-h-[140px] items-center justify-center rounded-xl border border-dashed border-line bg-surface/40 p-6 text-center text-xs text-muted transition-colors",
              isDragOver ? "border-accent/40 bg-orange-50/20 text-accent" : "",
            )}
          >
            Chưa có công việc nào trong cột này.
          </div>
        ) : (
          tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              isUpdating={updatingTaskIds.has(task.id)}
              onMoveStatus={onMoveStatus}
              onDragStart={onDragStartCard}
              onDragEnd={onDragEndCard}
            />
          ))
        )}
      </div>
    </section>
  );
}
