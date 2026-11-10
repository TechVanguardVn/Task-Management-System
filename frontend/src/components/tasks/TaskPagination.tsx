import { ChevronLeft, ChevronRight } from "lucide-react";
import { useId } from "react";

import { Button } from "../ui/Button";

interface TaskPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function TaskPagination({
  page,
  pageSize,
  total,
  totalPages,
  isLoading,
  onPageChange,
  onPageSizeChange,
}: TaskPaginationProps) {
  const pageSizeId = useId();

  if (totalPages < 1) {
    return null;
  }

  return (
    <nav
      aria-label="Phân trang công việc"
      className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <p className="text-sm font-medium text-ink">
          Trang <span className="font-semibold tabular-nums">{page}</span> /{" "}
          <span className="font-semibold tabular-nums">{totalPages}</span>
        </p>
        <p className="text-xs text-muted">
          Tổng <span className="font-medium tabular-nums">{total}</span> công việc
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={pageSizeId} className="text-xs text-muted">
            Số dòng
          </label>
          <select
            id={pageSizeId}
            value={pageSize}
            disabled={isLoading}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-9 rounded-xl border border-line bg-surface px-2.5 text-sm font-medium text-ink shadow-xs transition-colors duration-150 hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            aria-label="Trang trước"
            disabled={page <= 1 || isLoading}
            onClick={() => onPageChange(page - 1)}
            className="h-9 px-3"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Trước
          </Button>
          <Button
            variant="secondary"
            aria-label="Trang sau"
            disabled={page >= totalPages || isLoading}
            onClick={() => onPageChange(page + 1)}
            className="h-9 px-3"
          >
            Sau
            <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
