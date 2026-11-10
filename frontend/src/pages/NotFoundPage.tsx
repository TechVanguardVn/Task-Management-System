import { Link } from "react-router";

import { useAuth } from "../context/AuthContext";
import { Spinner } from "../components/ui/Spinner";

export function NotFoundPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const destination = isAuthenticated ? "/dashboard" : "/login";
  const destinationLabel = isAuthenticated ? "Back to dashboard" : "Go to sign in";

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5">
      <section
        aria-labelledby="not-found-title"
        className="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xs sm:p-8"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
          404 / Not found
        </p>
        <h1
          id="not-found-title"
          className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl"
        >
          This page is not on the map.
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          The address may have changed, or the page may not exist yet. Return to
          the workspace and keep going.
        </p>

        <div className="mt-6 border-t border-line pt-5">
          {isLoading ? (
            <Spinner size="sm" label="Checking your session" className="text-accent" />
          ) : (
            <Link
              to={destination}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-accent bg-accent px-4 text-sm font-medium text-white shadow-xs transition-colors hover:border-accent-hover hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              {destinationLabel}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
