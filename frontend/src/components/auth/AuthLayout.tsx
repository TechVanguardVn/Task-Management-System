import type { ReactNode } from "react";
import { Command } from "lucide-react";
import { Link } from "react-router";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

const STEPS = [
  { index: "01", label: "Capture" },
  { index: "02", label: "Focus" },
  { index: "03", label: "Finish" },
] as const;

export function AuthLayout({
  eyebrow,
  title,
  description,
  children,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(32rem,0.95fr)]">
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div
          aria-hidden="true"
          className="canvas-grid pointer-events-none absolute inset-0"
        />

        <Link
          to="/login"
          className="relative flex w-fit items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-surface"
        >
          <span className="grid size-10 place-items-center rounded-xl border border-orange-200 bg-orange-50 shadow-xs">
            <Command aria-hidden="true" className="size-4 text-accent" />
          </span>
          <span className="leading-none">
            <span className="block text-sm font-semibold tracking-[-0.02em] text-ink">
              Fieldnote
            </span>
            <span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
              Task workspace
            </span>
          </span>
        </Link>

        <div className="relative max-w-xl py-16">
          <p className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            <span aria-hidden="true" className="h-px w-8 bg-accent" />
            Workspace access
          </p>
          <h2 className="mt-6 max-w-[12ch] text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-ink xl:text-6xl">
            Make room for the work that matters.
          </h2>
          <p className="mt-6 max-w-md text-sm leading-6 text-muted">
            Sign in to keep tasks, priorities, and next actions in one quiet
            place. No noise, no crowded dashboard.
          </p>

          <div className="mt-12 grid grid-cols-3 overflow-hidden rounded-2xl border border-line bg-surface-subtle">
            {STEPS.map((step) => (
              <div
                key={step.index}
                className="border-r border-line px-4 py-4 last:border-r-0"
              >
                <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-accent">
                  {step.index}
                </p>
                <p className="mt-1.5 text-sm font-semibold text-ink">{step.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-4 border-t border-line pt-5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          <span>Fieldnote / Access</span>
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-brand"
            />
            Private workspace
          </span>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col bg-canvas">
        <header className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4 sm:px-8 lg:hidden">
          <Link
            to="/login"
            className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          >
            <span className="grid size-8 place-items-center rounded-xl border border-orange-200 bg-orange-50 shadow-xs">
              <Command aria-hidden="true" className="size-3.5 text-accent" />
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em] text-ink">
              Fieldnote
            </span>
          </Link>
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Workspace access
          </span>
        </header>

        <div className="flex flex-1 items-center px-5 py-12 sm:px-8 lg:px-14">
          <div className="mx-auto w-full max-w-[28rem] rounded-2xl border border-line bg-surface p-6 shadow-xs sm:p-8">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-ink sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>

        <footer className="border-t border-line bg-surface px-5 py-4 sm:px-8 lg:px-14">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Fieldnote / Task management MVP
          </p>
        </footer>
      </main>
    </div>
  );
}
