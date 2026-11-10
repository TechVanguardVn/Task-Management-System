import { createPortal } from "react-dom";
import { Spinner } from "../ui/Spinner";

export function ModalLoadingFallback() {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      aria-busy="true"
      aria-label="Đang mở hộp thoại"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-xs"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-5 shadow-xl shadow-slate-900/10">
        <Spinner size="sm" label="Đang tải..." className="text-accent" />
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
          Đang tải hộp thoại...
        </span>
      </div>
    </div>,
    document.body,
  );
}
