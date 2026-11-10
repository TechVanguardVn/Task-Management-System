import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { getSafeRedirectPath } from "../../lib/navigation";
import { SessionLoadingScreen } from "../layout/SessionLoadingScreen";

interface PublicRouteState {
  from?: unknown;
}

export function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <SessionLoadingScreen />;
  }

  if (isAuthenticated) {
    const state = location.state as PublicRouteState | null;
    const destination = getSafeRedirectPath(state?.from) ?? "/dashboard";

    return <Navigate to={destination} replace />;
  }

  return (
    <Suspense fallback={<SessionLoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}
