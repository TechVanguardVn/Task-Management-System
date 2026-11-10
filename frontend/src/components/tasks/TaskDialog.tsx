import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

import { cn } from "../../lib/utils";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hasAttribute("hidden") &&
      element.getAttribute("aria-hidden") !== "true",
  );
}

interface TaskDialogProps {
  title: string;
  titleId: string;
  descriptionId?: string;
  eyebrow?: string;
  onClose: () => void;
  isBusy?: boolean;
  size?: "md" | "lg";
  children: ReactNode;
  footer?: ReactNode;
}

export function TaskDialog({
  title,
  titleId,
  descriptionId,
  eyebrow,
  onClose,
  isBusy = false,
  size = "md",
  children,
  footer,
}: TaskDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const isBusyRef = useRef(isBusy);

  useEffect(() => {
    onCloseRef.current = onClose;
    isBusyRef.current = isBusy;
  });

  useEffect(() => {
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusTarget =
      panel?.querySelector<HTMLElement>("[data-dialog-initial-focus]") ??
      (panel ? getFocusableElements(panel)[0] : undefined) ??
      panel;

    focusTarget?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!panel) {
        return;
      }

      if (event.key === "Escape") {
        if (isBusyRef.current) {
          return;
        }

        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(panel);

      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        return;
      }

      if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      if (
        previouslyFocused instanceof HTMLElement &&
        previouslyFocused.isConnected
      ) {
        previouslyFocused.focus();
      }
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/25 p-4 backdrop-blur-xs"
      onMouseDown={(event) => {
        if (
          !panelRef.current?.contains(event.target as Node) &&
          !isBusyRef.current
        ) {
          onCloseRef.current();
        }
      }}
    >
      <div className="flex min-h-full items-end justify-center sm:items-center">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className={cn(
            "relative w-full overflow-hidden rounded-2xl border border-line bg-surface shadow-xl shadow-slate-900/10 focus:outline-none",
            size === "lg" ? "max-w-2xl" : "max-w-lg",
          )}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <header className="flex items-start justify-between gap-4 border-b border-line bg-surface-subtle/50 px-5 py-4 sm:px-6">
            <div>
              {eyebrow ? (
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  {eyebrow}
                </p>
              ) : null}
              <h2
                id={titleId}
                className={cn(
                  "text-xl font-semibold tracking-[-0.03em] text-ink",
                  eyebrow ? "mt-1.5" : null,
                )}
              >
                {title}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              aria-label="Đóng hộp thoại"
              className="-mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-55"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </header>

          <div className="px-5 py-5 sm:px-6">{children}</div>

          {footer ? (
            <footer className="flex flex-wrap justify-end gap-3 border-t border-line bg-surface-subtle/50 px-5 py-4 sm:px-6">
              {footer}
            </footer>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}
