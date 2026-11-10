import { Navigate, Outlet, useLocation } from "react-router";

import { useAuth } from "../../context/AuthContext";
import { SessionLoadingScreen } from "../layout/SessionLoadingScreen";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";

export function ProtectedRoute() {
  const {
    accessToken,
    isAuthenticated,
    isLoading,
    logout,
    restoreSession,
    sessionError,
  } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <SessionLoadingScreen />;
  }

  if (!isAuthenticated && accessToken && sessionError) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas px-5">
        <section
          aria-labelledby="recovery-title"
          className="w-full max-w-md border border-line bg-surface p-6"
        >
          <Badge tone="medium">Session check</Badge>
          <h1
            id="recovery-title"
            className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-ink"
          >
            We could not restore your session
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted">{sessionError}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => void restoreSession()}>Try again</Button>
            <Button variant="ghost" onClick={() => void logout()}>
              Sign in again
            </Button>
          </div>
        </section>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
