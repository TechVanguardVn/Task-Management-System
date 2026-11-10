import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import {
  Command,
  Kanban,
  LayoutDashboard,
  ListChecks,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/kanban", label: "Kanban", icon: Kanban },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
] as const;

interface SidebarContentProps {
  onNavigate?: () => void;
  onClose?: () => void;
  closeButtonRef?: RefObject<HTMLButtonElement | null>;
}

function SidebarProfile() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="border-t border-line bg-surface-subtle px-5 py-4">
      <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
        Signed in
      </p>
      <p className="mt-1.5 truncate text-sm font-semibold text-ink">
        {user.full_name}
      </p>
      <p className="mt-0.5 truncate text-xs text-muted">{user.email}</p>
    </div>
  );
}

function SidebarContent({
  onNavigate,
  onClose,
  closeButtonRef,
}: SidebarContentProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-5">
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-orange-200 bg-orange-50 shadow-xs">
            <Command aria-hidden="true" className="size-4 text-accent" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block truncate text-sm font-semibold tracking-[-0.02em] text-ink">
              Fieldnote
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
              Task workspace
            </span>
          </span>
        </Link>

        {onClose ? (
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            aria-label="Close navigation"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <nav aria-label="Workspace" className="flex-1 px-3 py-6">
        <p className="px-3 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
          Workspace
        </p>
        <ul className="mt-3 grid gap-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      "group flex h-10 items-center gap-3 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
                      isActive
                        ? "border-orange-200 bg-orange-50/90 font-semibold text-orange-950 shadow-xs"
                        : "border-transparent text-slate-600 hover:border-line hover:bg-slate-100/70 hover:text-ink",
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          "size-4 shrink-0",
                          isActive ? "text-accent" : "text-muted",
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      <span
                        aria-hidden="true"
                        className={cn(
                          "size-1.5 rounded-full",
                          isActive ? "bg-accent" : "bg-transparent",
                        )}
                      />
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <SidebarProfile />
    </>
  );
}

export function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    function getFocusableElements(): HTMLElement[] {
      const panel = panelRef.current;

      if (!panel) {
        return [];
      }

      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = getFocusableElements();
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const panel = panelRef.current;

      if (!first || !last || !panel) {
        event.preventDefault();
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
      }

      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isMobileOpen, onClose]);

  return (
    <>
      <aside className="hidden border-r border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <SidebarContent />
      </aside>

      {isMobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            tabIndex={-1}
            aria-label="Dismiss navigation"
            className="absolute inset-0 size-full bg-slate-900/25 backdrop-blur-xs"
            onClick={onClose}
          />
          <div
            ref={panelRef}
            id="mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Workspace navigation"
            className="relative flex h-full w-[min(18rem,85vw)] flex-col border-r border-line bg-surface shadow-xl"
          >
            <SidebarContent
              onNavigate={onClose}
              onClose={onClose}
              closeButtonRef={closeButtonRef}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
