import { Spinner } from "../ui/Spinner";

interface RouteLoadingFallbackProps {
  label?: string;
}

export function RouteLoadingFallback({
  label = "Đang tải dữ liệu...",
}: RouteLoadingFallbackProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className="flex min-h-[240px] items-center justify-center p-8"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-5 shadow-xs">
        <Spinner size="sm" label={label} className="text-accent" />
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            Không gian làm việc
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">{label}</p>
        </div>
      </div>
    </div>
  );
}
