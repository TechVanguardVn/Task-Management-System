import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

export type BadgeTone =
  | "neutral"
  | "todo"
  | "in-progress"
  | "done"
  | "low"
  | "medium"
  | "high";

export interface BadgeProps {
  tone?: BadgeTone;
  children?: ReactNode;
  className?: string;
}

const TONE_CONFIG: Record<
  BadgeTone,
  { label: string; dotClassName: string; badgeClassName: string }
> = {
  neutral: {
    label: "Neutral",
    dotClassName: "bg-slate-400",
    badgeClassName: "border-slate-200 bg-slate-100/90 text-slate-700",
  },
  todo: {
    label: "To do",
    dotClassName: "bg-slate-500",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
  },
  "in-progress": {
    label: "In progress",
    dotClassName: "bg-amber-500",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
  },
  done: {
    label: "Done",
    dotClassName: "bg-emerald-600",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  low: {
    label: "Low",
    dotClassName: "bg-slate-500",
    badgeClassName: "border-slate-200 bg-slate-100 text-slate-700",
  },
  medium: {
    label: "Medium",
    dotClassName: "bg-amber-500",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-800",
  },
  high: {
    label: "High",
    dotClassName: "bg-red-500",
    badgeClassName: "border-red-200 bg-red-50 text-red-700",
  },
};

export function Badge({ tone = "neutral", children, className }: BadgeProps) {
  const config = TONE_CONFIG[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 font-mono text-[10px] font-medium uppercase leading-normal tracking-[0.12em]",
        config.badgeClassName,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", config.dotClassName)}
      />
      {children ?? config.label}
    </span>
  );
}
