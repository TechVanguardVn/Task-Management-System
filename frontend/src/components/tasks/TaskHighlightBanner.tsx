import { AlertCircle, ArrowUpRight, CheckCircle2, RotateCw, X } from "lucide-react";

import type { Task } from "../../types/task";
import { Button } from "../ui/Button";

export type HighlightBannerState =
  | { type: "found"; task: Task }
  | { type: "not_found" }
  | { type: "error"; message?: string; isRetrying?: boolean };

interface TaskHighlightBannerProps {
  state: HighlightBannerState;
  onOpenDetails?: (taskId: number) => void;
  onRetry?: () => void;
  onDismiss: () => void;
}

export function TaskHighlightBanner({
  state,
  onOpenDetails,
  onRetry,
  onDismiss,
}: TaskHighlightBannerProps) {
  const isError = state.type === "error" || state.type === "not_found";

  return (
    <section
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-labelledby="highlight-banner-title"
      className="relative overflow-hidden rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-1 ${
          isError ? "bg-danger" : "bg-accent"
        }`}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl border ${
              isError
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-orange-200 bg-orange-50 text-accent shadow-xs"
            }`}
          >
            {state.type === "found" ? (
              <CheckCircle2 aria-hidden="true" className="size-4" />
            ) : (
              <AlertCircle aria-hidden="true" className="size-4" />
            )}
          </span>

          <div className="min-w-0">
            <p
              id="highlight-banner-eyebrow"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
            >
              {state.type === "found"
                ? "Liên kết công việc"
                : state.type === "not_found"
                  ? "Không tìm thấy"
                  : "Kết nối gián đoạn"}
            </p>

            <h3
              id="highlight-banner-title"
              className="mt-1 text-sm font-medium leading-6 text-ink"
            >
              {state.type === "found" ? (
                <>
                  Bạn đang chuyển đến công việc{" "}
                  <strong className="font-semibold text-accent">
                    "{state.task.title}"
                  </strong>
                  . Công việc này hiện không nằm trong danh sách đang hiển thị.
                </>
              ) : state.type === "not_found" ? (
                "Công việc này không tồn tại hoặc đã bị xóa."
              ) : (
                state.message ||
                "Không thể tải thông tin công việc được liên kết. Kiểm tra kết nối mạng và thử lại."
              )}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
          {state.type === "found" && onOpenDetails ? (
            <Button
              variant="secondary"
              onClick={() => onOpenDetails(state.task.id)}
              className="h-8 px-3 text-xs"
            >
              Xem chi tiết
              <ArrowUpRight aria-hidden="true" className="size-3.5" />
            </Button>
          ) : null}

          {state.type === "error" && onRetry ? (
            <Button
              variant="secondary"
              isLoading={state.isRetrying}
              disabled={state.isRetrying}
              onClick={onRetry}
              className="h-8 px-3 text-xs"
            >
              <RotateCw aria-hidden="true" className="size-3.5" />
              Thử lại
            </Button>
          ) : null}

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Đóng thông báo liên kết"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
