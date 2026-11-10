import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { KanbanBoard } from "../components/kanban/KanbanBoard";

export function KanbanPage() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="border-b border-line pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              Fieldnote / Tiến độ
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              Bảng Kanban
            </h1>
            <p className="mt-2.5 max-w-2xl text-sm leading-6 text-muted">
              Trực quan hóa quy trình làm việc, kéo thả hoặc chọn trạng thái nhanh
              để cập nhật tiến độ.
            </p>
          </div>

          <Link
            to="/tasks"
            className="inline-flex min-h-11 w-fit shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink shadow-xs transition-colors hover:border-line-strong hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas self-start sm:self-auto"
          >
            Mở danh sách công việc
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </header>

      <div className="mt-6">
        <KanbanBoard />
      </div>
    </div>
  );
}
