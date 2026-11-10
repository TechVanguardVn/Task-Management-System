import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils";
import { Spinner } from "./Spinner";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const BASE_STYLES =
  "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium tracking-[-0.01em] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:opacity-55";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    "border-accent bg-accent text-white shadow-xs hover:border-accent-hover hover:bg-accent-hover active:bg-accent-hover",
  secondary:
    "border-line bg-surface text-ink shadow-xs hover:border-line-strong hover:bg-surface-subtle active:bg-slate-100",
  ghost:
    "border-transparent bg-transparent text-muted hover:bg-slate-100 hover:text-ink active:bg-slate-200",
  danger:
    "border-danger bg-danger text-white shadow-xs hover:border-danger-strong hover:bg-danger-strong active:bg-danger-hover",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      isLoading = false,
      disabled,
      className,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(BASE_STYLES, VARIANT_STYLES[variant], className)}
        {...props}
        aria-busy={isLoading || undefined}
      >
        {isLoading ? (
          <Spinner size="sm" label="Loading" className="text-current" />
        ) : null}
        {children}
      </button>
    );
  },
);
