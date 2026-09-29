import { CalendarDays, Edit3, Trash2 } from "lucide-react";
import { isOverdue } from "../lib/task";
import type { Task } from "../types";
import { PriorityBadge, StatusBadge } from "./TaskBadge";

export function TaskList({
  tasks,
  onEdit,
  onDelete,
  onOpen,
}: {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onOpen?: (task: Task) => void;
}) {
  if (!tasks.length)
    return (
      <div className="py-16 text-center">
        <CalendarDays className="mx-auto text-slate-300" size={42} />
        <h2 className="mt-3 font-semibold">Chưa có công việc phù hợp</h2>
        <p className="mt-1 text-sm text-slate-500">
          Hãy tạo công việc đầu tiên hoặc điều chỉnh bộ lọc.
        </p>
      </div>
    );
  return (
    <ul className="divide-y divide-slate-200" role="list">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-start gap-3 p-4 hover:bg-slate-50"
        >
          <button
            onClick={() => onOpen?.(task)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate font-semibold text-slate-800">
              {task.title}
            </p>
            {task.description && (
              <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                {task.description}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusBadge status={task.status} />
              <PriorityBadge priority={task.priority} />
              {task.dueDate && (
                <span
                  className={`text-xs ${isOverdue(task) ? "font-semibold text-red-700" : "text-slate-500"}`}
                >
                  Hạn:{" "}
                  {new Date(`${task.dueDate}T00:00:00`).toLocaleDateString(
                    "vi-VN",
                  )}
                  {isOverdue(task) ? " (quá hạn)" : ""}
                </span>
              )}
            </div>
          </button>
          <div className="flex shrink-0 gap-1">
            <button
              aria-label={`Sửa ${task.title}`}
              onClick={() => onEdit(task)}
              className="rounded p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            >
              <Edit3 size={17} />
            </button>
            <button
              aria-label={`Xóa ${task.title}`}
              onClick={() => onDelete(task)}
              className="rounded p-2 text-slate-500 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="space-y-0" aria-busy="true" aria-label="Đang tải công việc">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse border-b border-slate-200 bg-slate-100"
        />
      ))}
    </div>
  );
}
