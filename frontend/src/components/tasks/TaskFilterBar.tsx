import { ChevronDown, Search, X } from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { TaskPriority, TaskStatus } from "../../types/task";

interface TaskFilterBarProps {
  search: string;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  hasActiveFilters: boolean;
  onSearchChange: (search: string) => void;
  onStatusChange: (status: TaskStatus | null) => void;
  onPriorityChange: (priority: TaskPriority | null) => void;
  onClearFilters: () => void;
}

const STATUS_OPTIONS: ReadonlyArray<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "Cần làm" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "DONE", label: "Hoàn thành" },
];

const PRIORITY_OPTIONS: ReadonlyArray<{
  value: TaskPriority;
  label: string;
}> = [
  { value: "HIGH", label: "Cao" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "LOW", label: "Thấp" },
];

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: FilterSelectProps) {
  const id = useId();

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-line bg-surface px-3 pr-9 text-sm text-ink transition-colors duration-150 hover:border-line-strong focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
        />
      </div>
    </div>
  );
}

export function TaskFilterBar({
  search,
  status,
  priority,
  hasActiveFilters,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onClearFilters,
}: TaskFilterBarProps) {
  return (
    <section
      role="search"
      aria-label="Bộ lọc công việc"
      className="rounded-2xl border border-line bg-surface p-4 shadow-xs sm:p-5"
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_12rem_auto] md:items-end">
        <Input
          label="Tìm kiếm"
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo tiêu đề hoặc mô tả"
          autoComplete="off"
          endAdornment={
            <Search
              aria-hidden="true"
              className="mr-2 size-4 text-muted"
            />
          }
        />

        <FilterSelect
          label="Trạng thái"
          value={status ?? ""}
          onChange={(value) =>
            onStatusChange(value ? (value as TaskStatus) : null)
          }
        >
          <option value="">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          label="Mức ưu tiên"
          value={priority ?? ""}
          onChange={(value) =>
            onPriorityChange(value ? (value as TaskPriority) : null)
          }
        >
          <option value="">Tất cả ưu tiên</option>
          {PRIORITY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>

        <Button
          variant="ghost"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="w-full md:w-auto"
        >
          <X aria-hidden="true" className="size-4" />
          Xóa bộ lọc
        </Button>
      </div>
    </section>
  );
}
