import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useCurrentUser } from "../features/auth/hooks/useAuth";

function SessionCheckingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bento-canvas flex min-h-dvh items-center justify-center p-4"
    >
      <div className="bento-card flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium text-slate-700">
        <Loader2 className="h-4 w-4 animate-spin text-zinc-900" aria-hidden="true" />
        <span>Đang kiểm tra phiên đăng nhập...</span>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const location = useLocation();
  const { data: user, isPending } = useCurrentUser();

  if (isPending) {
    return <SessionCheckingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { data: user, isPending } = useCurrentUser();

  if (isPending) {
    return <SessionCheckingScreen />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
