import { cn } from "../../lib/utils";
import type { DashboardStatsResponse } from "../../types/dashboard";

interface MetricsStripProps {
  stats: DashboardStatsResponse;
}

type StatusCountKey =
  | "todo_tasks"
  | "in_progress_tasks"
  | "completed_tasks";

const STATUS_GROUPS: ReadonlyArray<{
  key: StatusCountKey;
  label: string;
  dotClassName: string;
  barClassName: string;
}> = [
  {
    key: "todo_tasks",
    label: "Cần làm",
    dotClassName: "bg-slate-500",
    barClassName: "bg-slate-400",
  },
  {
    key: "in_progress_tasks",
    label: "Đang làm",
    dotClassName: "bg-amber-500",
    barClassName: "bg-amber-500",
  },
  {
    key: "completed_tasks",
    label: "Hoàn thành",
    dotClassName: "bg-emerald-600",
    barClassName: "bg-emerald-600",
  },
];

function getPercentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export function MetricsStrip({ stats }: MetricsStripProps) {
  const total = stats.total_tasks;
  const completedPercentage = getPercentage(
    stats.completed_tasks,
    total,
  );
  const distributionLabel =
    total > 0
      ? `Phân bổ trạng thái: ${stats.todo_tasks} cần làm, ${stats.in_progress_tasks} đang làm, ${stats.completed_tasks} hoàn thành.`
      : "Chưa có công việc để phân bổ theo trạng thái.";

  return (
    <section
      aria-labelledby="metrics-heading"
      className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(19rem,0.5fr)]"
    >
      <h2 id="metrics-heading" className="sr-only">
        Tổng quan công việc
      </h2>

      <article className="relative overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-subtle/60 px-5 py-3.5 sm:px-7">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Tổng quan công việc
          </p>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
            Tiến độ / Trạng thái
          </p>
        </div>

        <div className="p-5 sm:p-7">
          <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Tổng công việc
              </p>
              <p className="mt-2 text-[clamp(4.5rem,12vw,6.5rem)] font-semibold leading-[0.85] tracking-[-0.07em] tabular-nums text-ink">
                {total}
              </p>
            </div>

            <div className="border-l-2 border-emerald-500 pl-4 sm:pb-1 sm:text-right">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Đã hoàn thành
              </p>
              <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] tabular-nums text-emerald-700">
                {completedPercentage}%
              </p>
              <p className="mt-1 text-xs text-muted">
                {stats.completed_tasks} / {total} công việc
              </p>
            </div>
          </div>

          <div className="mt-7">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-medium text-ink">Tiến độ hoàn thành</span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {completedPercentage}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label={`Tỉ lệ hoàn thành: ${completedPercentage}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completedPercentage}
              className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-100"
            >
              <div
                aria-hidden="true"
                className="h-full rounded-full bg-emerald-600 transition-[width] duration-300 motion-reduce:transition-none"
                style={{ width: `${completedPercentage}%` }}
              />
            </div>
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
                Phân bổ trạng thái
              </p>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                {total} công việc
              </p>
            </div>

            <div role="img" aria-label={distributionLabel}>
              <div
                aria-hidden="true"
                className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100"
              >
                {total === 0 ? (
                  <span className="h-full w-full bg-slate-200" />
                ) : (
                  STATUS_GROUPS.map((group) => {
                    const value = stats[group.key];

                    if (value === 0) {
                      return null;
                    }

                    return (
                      <span
                        key={group.key}
                        className={group.barClassName}
                        style={{
                          width: `${(value / total) * 100}%`,
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>

            <ul className="mt-4 grid grid-cols-3 gap-3">
              {STATUS_GROUPS.map((group) => (
                <li key={group.key} className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs text-muted">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        group.dotClassName,
                      )}
                    />
                    <span className="truncate">{group.label}</span>
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
                    {stats[group.key]}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </article>

      <div
        role="group"
        aria-label="Số lượng theo trạng thái"
        className="grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-surface shadow-xs divide-x divide-line lg:grid-cols-1 lg:divide-x-0 lg:divide-y"
      >
        {STATUS_GROUPS.map((group) => {
          const value = stats[group.key];
          const share = getPercentage(value, total);

          return (
            <article key={group.key} className="p-4 sm:p-5 transition-colors hover:bg-surface-subtle/50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted">{group.label}</p>
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full", group.dotClassName)}
                />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] tabular-nums text-ink">
                {value}
              </p>
              <p className="mt-1 font-mono text-[9px] font-medium uppercase tracking-[0.14em] text-muted">
                {share}% tổng số
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
