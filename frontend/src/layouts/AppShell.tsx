import {
  FolderKanban,
  LayoutGrid,
  Loader2,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useCurrentUser, useLogoutMutation } from "../features/auth/hooks/useAuth";

function getWorkspaceTitle(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "Personal Workspace";
  }
  const parts = trimmed.split(/\s+/);
  const shortName = parts[parts.length - 1] || trimmed;
  return `${shortName}'s Workspace`;
}

function getUserInitial(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "U";
  }
  const parts = trimmed.split(/\s+/);
  const last = parts[parts.length - 1] || trimmed;
  return last.charAt(0).toUpperCase();
}

export function AppShell() {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogoutMutation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!user) {
    return null;
  }

  const workspaceTitle = getWorkspaceTitle(user.name);
  const userInitial = getUserInitial(user.name);

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      navigate("/login", { replace: true });
    } catch {
      navigate("/login", { replace: true });
    }
  };

  const navItems = [
    {
      to: "/dashboard",
      label: "Tổng quan Dashboard",
      icon: LayoutGrid,
    },
    {
      to: "/projects",
      label: "Dự án của tôi",
      icon: FolderKanban,
    },
  ];

  return (
    <div className="bento-canvas min-h-dvh p-3 sm:p-4 lg:p-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start">
        {/* Mobile Top Bar */}
        <header className="bento-card flex items-center justify-between rounded-2xl px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white"
            >
              {userInitial}
            </div>
            <div className="min-w-0">
              <p className="font-heading truncate text-sm font-semibold text-zinc-900">
                {workspaceTitle}
              </p>
              <p className="truncate text-xs text-slate-500">
                Personal Projects &amp; Tasks
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            aria-expanded={mobileMenuOpen}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </header>

        {/* Floating Bento Sidebar */}
        <aside
          aria-label="Điều hướng chính"
          className={`bento-card w-full shrink-0 flex-col justify-between rounded-3xl p-5 lg:sticky lg:top-5 lg:flex lg:min-h-[calc(100dvh-2.5rem)] lg:w-72 ${
            mobileMenuOpen ? "flex" : "hidden"
          }`}
        >
          <div>
            {/* Personalized Workspace Header (Method 1) */}
            <div className="mb-6 hidden items-center gap-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 lg:flex">
              <div
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white shadow-xs"
              >
                {userInitial}
              </div>
              <div className="min-w-0">
                <p className="font-heading truncate text-sm font-semibold text-zinc-900">
                  {workspaceTitle}
                </p>
                <p className="truncate text-xs text-slate-500">
                  Personal Projects &amp; Tasks
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="mb-2 px-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Không gian làm việc
            </div>
            <nav className="space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-[44px] items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-all focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none ${
                        isActive
                          ? "bg-zinc-900 font-semibold text-white shadow-xs"
                          : "font-medium text-slate-600 hover:bg-slate-100 hover:text-zinc-900"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Account & Separated Logout Action */}
          <div className="mt-6 border-t border-slate-200/80 pt-4">
            <div className="mb-3 rounded-2xl bg-slate-50 px-3.5 py-3">
              <p className="truncate text-sm font-semibold text-zinc-900">
                {user.name}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {logoutMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Đang đăng xuất...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Đăng xuất</span>
                </>
              )}
            </button>
          </div>
        </aside>

        {/* Main Workspace Content */}
        <main id="main-content" className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
