import { Menu } from "lucide-react";
import { useLocation } from "react-router";

import { UserProfileBadge } from "./UserProfileBadge";

interface HeaderProps {
  isNavigationOpen: boolean;
  onOpenNavigation: () => void;
}

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/tasks": "Tasks",
  "/kanban": "Kanban",
};

export function Header({
  isNavigationOpen,
  onOpenNavigation,
}: HeaderProps) {
  const location = useLocation();
  const pageLabel = PAGE_LABELS[location.pathname] ?? "Workspace";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={onOpenNavigation}
          aria-label="Open navigation"
          aria-controls="mobile-navigation"
          aria-expanded={isNavigationOpen}
          className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-muted transition-colors hover:bg-slate-100 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface lg:hidden"
        >
          <Menu aria-hidden="true" className="size-4" />
        </button>

        <div className="min-w-0">
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
            Workspace
          </p>
          <p className="truncate text-sm font-semibold text-ink">{pageLabel}</p>
        </div>

        <div className="ml-auto">
          <UserProfileBadge />
        </div>
      </div>
    </header>
  );
}
