import { useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";

function getInitials(fullName: string, email: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return `${first}${last}`.toUpperCase();
  }

  if (parts[0]) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

export function UserProfileBadge() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return null;
  }

  function handleLogout() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    void logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-3">
      <div className="hidden min-w-0 text-right sm:block">
        <p className="truncate text-sm font-semibold text-ink">{user.full_name}</p>
        <p className="truncate text-xs text-muted">{user.email}</p>
      </div>

      <span
        aria-hidden="true"
        className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-surface font-mono text-[11px] font-semibold tracking-[0.08em] text-ink shadow-xs"
      >
        {getInitials(user.full_name, user.email)}
      </span>

      <Button
        variant="ghost"
        className="h-9 px-2 sm:px-3"
        onClick={handleLogout}
        isLoading={isSigningOut}
        aria-label={`Sign out ${user.full_name}`}
      >
        <LogOut aria-hidden="true" className="size-4" />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}
