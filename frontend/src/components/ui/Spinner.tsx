import { cn } from "../../lib/utils";

export type SpinnerSize = "sm" | "md";

export interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({
  size = "md",
  label = "Loading",
  className,
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center justify-center", className)}
    >
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className={cn(
          "block rounded-full border-2 border-current border-r-transparent motion-safe:animate-spin",
          size === "sm" ? "size-4" : "size-6",
        )}
      />
    </span>
  );
}
