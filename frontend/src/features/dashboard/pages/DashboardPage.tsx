import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  FolderKanban,
  FolderPlus,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import type { TaskPriority, TaskStatus } from "../../../types/project.types";
import { useCurrentUser } from "../../auth/hooks/useAuth";
import { ProjectFormModal } from "../../projects/components/ProjectFormModal";
import { formatShortDate } from "../../projects/utils/date.utils";
import {
  useDashboardSummary,
  useDashboardUpcomingTasks,
} from "../hooks/useDashboard";

function getPriorityBadge(priority: TaskPriority): {
  label: string;
  className: string;
} {
  switch (priority) {
    case "HIGH":
      return {
        label: "High",
        className: "bg-rose-50 text-rose-700 border-rose-200/70",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        className: "bg-amber-50 text-amber-700 border-amber-200/70",
      };
    default:
      return {
        label: "Low",
        className: "bg-sky-50 text-sky-700 border-sky-200/70",
      };
  }
}

function getStatusBadge(status: TaskStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "DONE":
      return {
        label: "Done",
        className: "bg-emerald-50 text-emerald-700",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className: "bg-blue-50 text-blue-700",
      };
    default:
      return {
        label: "To Do",
        className: "bg-slate-100 text-slate-700",
      };
  }
}

export function DashboardPage() {
  const { data: user } = useCurrentUser();
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

  const summaryQuery = useDashboardSummary();
  const upcomingQuery = useDashboardUpcomingTasks(8);

  const isPending = summaryQuery.isPending || upcomingQuery.isPending;
  const isError = summaryQuery.isError || upcomingQuery.isError;
  const error = summaryQuery.error ?? upcomingQuery.error;

  const metrics = summaryQuery.data?.metrics ?? {
    totalProjects: 0,
    activeProjects: 0,
    archivedProjects: 0,
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    doneTasks: 0,
    overdueTasks: 0,
    overallProgress: 0,
  };

  const projects = summaryQuery.data?.projects ?? [];
  const upcomingTasks = upcomingQuery.data?.tasks ?? [];
  const upcomingMeta = upcomingQuery.data?.meta ?? {
    total: 0,
    overdueCount: 0,
    limit: 8,
  };

  const handleRetry = () => {
    void summaryQuery.refetch();
    void upcomingQuery.refetch();
  };

  return (
    <div className="space-y-4">
      {/* Top Welcome & Quick Actions Bento Card */}
      <section className="bento-card rounded-3xl p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="min-w-0">
            <h1 className="font-heading truncate text-2xl font-semibold text-zinc-900">
              Welcome back, {user?.name}
            </h1>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {metrics.activeProjects}{" "}
              {metrics.activeProjects === 1 ? "active project" : "active projects"} ·{" "}
              {metrics.overallProgress}% overall task completion
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/projects"
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            >
              <FolderKanban className="h-4 w-4" aria-hidden="true" />
              <span>All Projects</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsCreateProjectOpen(true)}
              className="inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
            >
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              <span>New Project</span>
            </button>
          </div>
        </div>
      </section>

      {isPending ? (
        <section
          role="status"
          aria-live="polite"
          className="bento-card flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-slate-600"
        >
          <Loader2 className="h-6 w-6 animate-spin text-zinc-900" aria-hidden="true" />
          <p className="text-sm font-medium">Loading workspace overview...</p>
        </section>
      ) : isError ? (
        <section
          role="alert"
          className="bento-card flex flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="font-heading text-base font-semibold text-zinc-900">
            Unable to load dashboard
          </p>
          <p className="max-w-md text-xs text-slate-600">
            {getFriendlyErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-1 cursor-pointer rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Retry
          </button>
        </section>
      ) : (
        <>
          {/* KPI Summary Row */}
          <section
            aria-label="Task statistics"
            className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-5"
          >
            {/* Total Tasks */}
            <div className="bento-card col-span-2 flex flex-col justify-between rounded-3xl p-4 sm:col-span-1 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Total Tasks
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-zinc-900">
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <p className="font-heading text-2xl font-bold text-zinc-900">
                  {metrics.totalTasks}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    role="progressbar"
                    aria-valuenow={metrics.overallProgress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Overall task completion"
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      className="h-full rounded-full bg-zinc-900 transition-all duration-300"
                      style={{ width: `${metrics.overallProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold whitespace-nowrap text-slate-600">
                    {metrics.overallProgress}%
                  </span>
                </div>
              </div>
            </div>

            {/* To Do */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">To Do</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <CircleDot className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <p className="font-heading text-2xl font-bold text-zinc-900">
                  {metrics.todoTasks}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Not started
                </p>
              </div>
            </div>

            {/* In Progress */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  In Progress
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <p className="font-heading text-2xl font-bold text-blue-700">
                  {metrics.inProgressTasks}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Active work
                </p>
              </div>
            </div>

            {/* Completed */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Completed
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <p className="font-heading text-2xl font-bold text-emerald-700">
                  {metrics.doneTasks}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Finished tasks
                </p>
              </div>
            </div>

            {/* Overdue */}
            <div className="bento-card flex flex-col justify-between rounded-3xl p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-500">
                  Overdue
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>
              <div className="mt-3">
                <p
                  className={`font-heading text-2xl font-bold ${
                    metrics.overdueTasks > 0 ? "text-rose-600" : "text-zinc-900"
                  }`}
                >
                  {metrics.overdueTasks}
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">
                  Past due date
                </p>
              </div>
            </div>
          </section>

          {/* Main Two-Column Bento Content */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Left Column: Upcoming Deadlines */}
            <section
              aria-label="Upcoming deadlines"
              className="bento-card flex flex-col justify-between rounded-3xl p-5 sm:p-6 lg:col-span-7"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-heading text-base font-semibold text-zinc-900">
                      Upcoming Deadlines
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {upcomingMeta.total}
                    </span>
                    {upcomingMeta.overdueCount > 0 ? (
                      <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap text-rose-700">
                        {upcomingMeta.overdueCount} overdue
                      </span>
                    ) : null}
                  </div>
                </div>

                {upcomingTasks.length === 0 ? (
                  <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                      <Calendar className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="font-heading text-sm font-semibold text-zinc-900">
                      No upcoming deadlines
                    </p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">
                      {metrics.totalProjects === 0
                        ? "Create your first project and add tasks with due dates to track deadlines here."
                        : "All scheduled tasks are completed or have no due date assigned."}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {upcomingTasks.map((task) => {
                      const priorityBadge = getPriorityBadge(task.priority);
                      const statusBadge = getStatusBadge(task.status);
                      const projectColor = task.project.color || "#2563eb";

                      return (
                        <Link
                          key={task.id}
                          to={`/projects/${task.projectId}`}
                          className="group flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-slate-300 hover:bg-slate-50/70 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-zinc-900 transition-colors group-hover:text-blue-600">
                              {task.title}
                            </p>

                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                              <span className="inline-flex max-w-[180px] items-center gap-1.5 truncate rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                                <span
                                  aria-hidden="true"
                                  className="h-2 w-2 shrink-0 rounded-full"
                                  style={{ backgroundColor: projectColor }}
                                />
                                <span className="truncate">{task.project.name}</span>
                              </span>

                              <span
                                className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusBadge.className}`}
                              >
                                {statusBadge.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                            <span
                              className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${priorityBadge.className}`}
                            >
                              {priorityBadge.label}
                            </span>

                            <span
                              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                                task.isOverdue
                                  ? "bg-rose-50 text-rose-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                {task.isOverdue ? "Overdue · " : ""}
                                {formatShortDate(task.dueDate)}
                              </span>
                            </span>

                            <ArrowRight
                              className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-900"
                              aria-hidden="true"
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: My Projects Progress */}
            <section
              aria-label="My projects"
              className="bento-card flex flex-col justify-between rounded-3xl p-5 sm:p-6 lg:col-span-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-heading text-base font-semibold text-zinc-900">
                      My Projects
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      {metrics.totalProjects}
                    </span>
                  </div>

                  {metrics.totalProjects > 0 ? (
                    <Link
                      to="/projects"
                      className="inline-flex items-center gap-1 text-xs font-semibold whitespace-nowrap text-slate-600 transition-colors hover:text-zinc-900"
                    >
                      <span>View all</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>

                {projects.length === 0 ? (
                  <div className="mt-6 flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                    <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-zinc-900">
                      <FolderKanban className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <p className="font-heading text-sm font-semibold text-zinc-900">
                      No projects yet
                    </p>
                    <p className="mt-1 max-w-xs text-xs text-slate-500">
                      Create your first project to organize tasks and track progress on your Kanban board.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCreateProjectOpen(true)}
                      className="mt-4 inline-flex min-h-[38px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-zinc-800"
                    >
                      <FolderPlus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Create First Project</span>
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {projects.map((project) => {
                      const accentColor = project.color || "#2563eb";
                      const isArchived = project.status === "ARCHIVED";

                      return (
                        <Link
                          key={project.id}
                          to={`/projects/${project.id}`}
                          className="group block rounded-2xl border border-slate-200/80 bg-white p-3.5 transition-all hover:border-slate-300 hover:bg-slate-50/70"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <span
                                aria-hidden="true"
                                className="font-heading flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
                                style={{ backgroundColor: accentColor }}
                              >
                                {project.name.trim().charAt(0).toUpperCase()}
                              </span>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-900 transition-colors group-hover:text-blue-600">
                                  {project.name}
                                </p>
                                <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                                  <span>
                                    {project.stats.doneTasks}/{project.stats.totalTasks} done
                                  </span>
                                  {isArchived ? (
                                    <span className="rounded-md bg-amber-50 px-1.5 py-0.2 text-[10px] font-semibold text-amber-700">
                                      Archived
                                    </span>
                                  ) : null}
                                  {project.stats.overdueTasks > 0 ? (
                                    <span className="rounded-md bg-rose-50 px-1.5 py-0.2 text-[10px] font-semibold text-rose-700">
                                      {project.stats.overdueTasks} overdue
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>

                            <span className="font-heading shrink-0 text-xs font-bold text-zinc-900">
                              {project.stats.progress}%
                            </span>
                          </div>

                          <div
                            role="progressbar"
                            aria-valuenow={project.stats.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Progress for ${project.name}`}
                            className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
                          >
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: `${project.stats.progress}%`,
                                backgroundColor: accentColor,
                              }}
                            />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </div>
        </>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        open={isCreateProjectOpen}
        mode="create"
        onClose={() => setIsCreateProjectOpen(false)}
      />
    </div>
  );
}
