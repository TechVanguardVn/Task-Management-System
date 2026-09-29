import type { TaskPriority, TaskStatus } from "../types";
import { priorityLabel, statusLabel } from "../lib/task";

const statusStyles: Record<TaskStatus, string> = {
  TODO: "bg-slate-100 text-slate-700",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  DONE: "bg-emerald-100 text-emerald-800",
};
const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-100 text-slate-700",
  MEDIUM: "bg-amber-100 text-amber-800",
  HIGH: "bg-red-100 text-red-800",
};
export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[priority]}`}
    >
      {priorityLabel[priority]}
    </span>
  );
}
