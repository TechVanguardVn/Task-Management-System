import { ArrowRight, CheckCircle2, Clock, FolderKanban } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrentUser } from "../../auth/hooks/useAuth";

export function DashboardPlaceholderPage() {
  const { data: user } = useCurrentUser();

  return (
    <div className="space-y-4">
      <section className="bento-card rounded-3xl p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-zinc-900">
              Welcome back, {user?.name}
            </h1>
          </div>

          <Link
            to="/projects"
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            <span>Open Projects</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section
        aria-label="Overview stats"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <div className="bento-card rounded-3xl p-5">
          <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-zinc-900">
            <FolderKanban className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-slate-500">Workspace Model</p>
          <p className="font-heading mt-1 text-base font-semibold text-zinc-900">
            Projects &amp; Tasks
          </p>
        </div>

        <div className="bento-card rounded-3xl p-5">
          <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-slate-500">Workflow</p>
          <p className="font-heading mt-1 text-base font-semibold text-zinc-900">
            To Do · In Progress · Done
          </p>
        </div>

        <div className="bento-card rounded-3xl p-5">
          <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            <Clock className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-slate-500">Signed in as</p>
          <p className="font-heading mt-1 truncate text-base font-semibold text-zinc-900">
            {user?.email}
          </p>
        </div>
      </section>
    </div>
  );
}
