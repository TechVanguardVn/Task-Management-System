import { Suspense, useCallback, useState } from "react";
import { Outlet } from "react-router";

import { Header } from "./Header";
import { RouteLoadingFallback } from "./RouteLoadingFallback";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const openNavigation = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const closeNavigation = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-xl focus:border focus:border-accent focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink focus:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Skip to content
      </a>

      <Sidebar isMobileOpen={isMobileOpen} onClose={closeNavigation} />

      <div className="flex min-h-screen min-w-0 flex-col">
        <Header
          isNavigationOpen={isMobileOpen}
          onOpenNavigation={openNavigation}
        />
        <main
          id="main-content"
          className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10"
        >
          <Suspense fallback={<RouteLoadingFallback />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
