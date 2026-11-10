import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { DashboardEmptyState } from "../components/dashboard/DashboardEmptyState";
import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { MetricsStrip } from "../components/dashboard/MetricsStrip";
import { UpcomingDeadlinesList } from "../components/dashboard/UpcomingDeadlinesList";
import { Button } from "../components/ui/Button";
import { useDashboardStats } from "../hooks/useDashboardStats";

export function DashboardPage() {
  const { data, isLoading, error, refetch } = useDashboardStats();

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="border-b border-line pb-7">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Fieldnote / Tổng quan
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              Bảng điều khiển
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted">
              Một góc nhìn gọn về tiến độ công việc, nhịp hoàn thành và những
              hạn chót cần được chú ý tiếp theo.
            </p>
          </div>

          <Link
            to="/tasks"
            className="inline-flex min-h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink shadow-xs transition-colors hover:border-line-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Mở khu vực công việc
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      <div className="mt-6 grid gap-5">
        {isLoading && !data ? <DashboardSkeleton /> : null}

        {!isLoading && error && !data ? (
          <section
            role="alert"
            aria-labelledby="dashboard-error-heading"
            className="relative overflow-hidden rounded-2xl border border-red-200 bg-surface p-6 shadow-xs sm:p-8"
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 w-1 bg-danger"
            />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-danger-strong">
              Kết nối / Gián đoạn
            </p>
            <h2
              id="dashboard-error-heading"
              className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink"
            >
              Không thể tải bảng điều khiển.
            </h2>
            <p className="mt-2.5 max-w-xl text-sm leading-6 text-muted">
              {error.isNetworkError
                ? "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại."
                : "Đã xảy ra lỗi khi tải dữ liệu. Vui lòng thử lại."}
            </p>
            <Button
              variant="secondary"
              onClick={refetch}
              className="mt-6"
              aria-label="Thử lại tải bảng điều khiển"
            >
              Thử lại
            </Button>
          </section>
        ) : null}

        {data ? (
          <>
            <MetricsStrip stats={data} />

            {data.total_tasks === 0 ? (
              <DashboardEmptyState />
            ) : (
              <UpcomingDeadlinesList
                deadlines={data.upcoming_deadlines}
              />
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
