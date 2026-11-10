import { Spinner } from "../ui/Spinner";

export function SessionLoadingScreen() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-5">
      <div className="flex items-center gap-4 rounded-2xl border border-line bg-surface px-6 py-5 shadow-xs">
        <Spinner size="sm" label="Restoring your session" className="text-accent" />
        <div>
          <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
            Workspace access
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            Restoring your session…
          </p>
        </div>
      </div>
    </div>
  );
}
