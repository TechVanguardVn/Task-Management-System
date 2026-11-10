import { ArrowUpRight, CalendarClock } from "lucide-react";
import { Link } from "react-router";

import { formatDateTime, parseApiDate } from "../../lib/date";
import { cn } from "../../lib/utils";
import type { UpcomingDeadlineTask } from "../../types/dashboard";
import type { TaskPriority, TaskStatus } from "../../types/task";
import { Badge } from "../ui/Badge";
import type { BadgeTone } from "../ui/Badge";

interface UpcomingDeadlinesListProps {
  deadlines: UpcomingDeadlineTask[];
}

const STATUS_PRESENTATION: Record<
  TaskStatus,
  { label: string; tone: BadgeTone }
> = {
  TODO: { label: "Cần làm", tone: "todo" },
  IN_PROGRESS: { label: "Đang làm", tone: "in-progress" },
  DONE: { label: "Hoàn thành", tone: "done" },
};

const PRIORITY_PRESENTATION: Record<
  TaskPriority,
  { label: string; tone: BadgeTone }
> = {
  HIGH: { label: "Cao", tone: "high" },
  MEDIUM: { label: "Trung bình", tone: "medium" },
  LOW: { label: "Thấp", tone: "low" },
};

function startOfLocalDay(date: Date): number {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ).getTime();
}

function getDeadlineUrgency(dueDate: Date | null): {
  label: string;
  isNear: boolean;
} {
  if (!dueDate) {
    return { label: "Chưa rõ hạn", isNear: false };
  }

  const dayDifference = Math.round(
    (startOfLocalDay(dueDate) - startOfLocalDay(new Date())) / 86_400_000,
  );

  if (dayDifference <= 0) {
    return { label: "Hôm nay", isNear: true };
  }

  if (dayDifference === 1) {
    return { label: "Ngày mai", isNear: true };
  }

  return {
    label: `Còn ${dayDifference} ngày`,
    isNear: false,
  };
}

export function UpcomingDeadlinesList({
  deadlines,
}: UpcomingDeadlinesListProps) {
  const visibleDeadlines = deadlines.slice(0, 5);

  return (
    <section
      aria-labelledby="upcoming-deadlines-heading"
      className="overflow-hidden rounded-2xl border border-line bg-surface shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-subtle/60 px-5 py-4 sm:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-orange-200 bg-orange-50 shadow-xs">
            <CalendarClock aria-hidden="true" className="size-4 text-accent" />
          </span>
          <div className="min-w-0">
            <h2
              id="upcoming-deadlines-heading"
              className="text-base font-semibold tracking-[-0.02em] text-ink"
            >
              Hạn chót sắp tới
            </h2>
            <p className="mt-0.5 text-xs leading-5 text-muted">
              Những việc cần xong sớm nhất, theo giờ địa phương của bạn.
            </p>
          </div>
        </div>

        <Link
          to="/tasks"
          className="inline-flex min-h-11 items-center gap-1 px-1 text-xs font-semibold text-accent transition-colors hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          Mở danh sách
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
        </Link>
      </div>

      {visibleDeadlines.length === 0 ? (
        <div className="px-5 py-10 sm:px-7">
          <p className="text-sm text-muted">
            Không có công việc nào sắp đến hạn.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {visibleDeadlines.map((deadline) => {
            const dueDate = parseApiDate(deadline.due_date);
            const urgency = getDeadlineUrgency(dueDate);
            const status = STATUS_PRESENTATION[deadline.status];
            const priority = PRIORITY_PRESENTATION[deadline.priority];

            return (
              <li key={deadline.id} className="relative">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-0 left-0 w-1",
                    urgency.isNear ? "bg-accent" : "bg-transparent",
                  )}
                />

                <div className="grid gap-3 px-5 py-4 transition-colors hover:bg-surface-subtle/60 sm:px-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                  <div className="min-w-0">
                    <Link
                      to={`/tasks?highlight=${deadline.id}`}
                      className="inline-flex min-h-11 max-w-full items-center text-sm font-semibold text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <span className="break-words">{deadline.title}</span>
                    </Link>

                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge tone={priority.tone}>{priority.label}</Badge>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 md:justify-end">
                    <div className="min-w-0 text-left md:text-right">
                      <p
                        className={cn(
                          "font-mono text-[10px] uppercase tracking-[0.14em]",
                          urgency.isNear ? "font-semibold text-accent" : "text-muted",
                        )}
                      >
                        {urgency.label}
                      </p>
                      <time
                        dateTime={dueDate ? deadline.due_date : undefined}
                        className="mt-0.5 block text-xs leading-5 text-muted"
                      >
                        {formatDateTime(
                          deadline.due_date,
                          "vi-VN",
                          "Chưa rõ thời gian",
                        )}
                      </time>
                    </div>

                    <Link
                      to={`/tasks?highlight=${deadline.id}`}
                      aria-label={`Mở "${deadline.title}" trong khu vực công việc`}
                      className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted shadow-xs transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    >
                      <ArrowUpRight
                        aria-hidden="true"
                        className="size-4"
                      />
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
