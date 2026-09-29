import {
  ClipboardList,
  Columns3,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const links = [
  { to: "/", label: "Tổng quan", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Công việc", icon: ClipboardList },
  { to: "/kanban", label: "Bảng", icon: Columns3 },
];

export function AppLayout() {
  const [open, setOpen] = useState(false);
  const { user, signOut } = useAuth();
  const nav = (
    <nav className="space-y-1">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${isActive ? "bg-teal-50 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white p-4 lg:block">
        <p className="px-3 py-4 text-xl font-bold tracking-tight text-teal-800">
          TaskFlow
        </p>
        {nav}
        <div className="absolute inset-x-4 bottom-4 border-t border-slate-200 pt-4">
          <p className="truncate px-3 text-sm font-medium">{user?.fullName}</p>
          <p className="truncate px-3 text-xs text-slate-500">{user?.email}</p>
          <button
            onClick={signOut}
            className="mt-3 flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <p className="text-lg font-bold text-teal-800">TaskFlow</p>
        <button aria-label="Mở menu" onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            aria-label="Đóng menu"
            className="absolute inset-0 bg-slate-900/30"
            onClick={() => setOpen(false)}
          />
          <aside className="relative h-full w-72 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xl font-bold text-teal-800">TaskFlow</p>
              <button aria-label="Đóng menu" onClick={() => setOpen(false)}>
                <X />
              </button>
            </div>
            {nav}
            <button
              onClick={signOut}
              className="mt-6 flex items-center gap-3 px-3 py-2 text-sm text-red-700"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </aside>
        </div>
      )}
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:ml-64 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
