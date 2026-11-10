import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  ArrowUpDown,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock,
  Filter,
  FolderKanban,
  Kanban,
  ListTodo,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import type {
  ProjectStatus,
  SortOrder,
  TaskPriority,
  TaskStatus,
} from "../../../types/project.types";
import type { Task, TaskSortBy } from "../../../types/task.types";
import { DeleteTaskDialog } from "../../tasks/components/DeleteTaskDialog";
import { TaskFormModal } from "../../tasks/components/TaskFormModal";
import {
  useProjectTasksList,
  useUpdateTaskMutation,
} from "../../tasks/hooks/useTasks";
import { DeleteProjectDialog } from "../components/DeleteProjectDialog";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { useProjectSummary, useUpdateProjectMutation } from "../hooks/useProjects";
import { formatShortDate, isDateOverdue } from "../utils/date.utils";

type WorkspaceViewMode = "board" | "list" | "overview";

type TaskSortPreset =
  | "createdAt:desc"
  | "updatedAt:desc"
  | "dueDate:asc"
  | "priority:desc"
  | "priority:asc"
  | "title:asc";

const TASK_SORT_OPTIONS: Array<{ value: TaskSortPreset; label: string }> = [
  { value: "createdAt:desc", label: "Newest" },
  { value: "updatedAt:desc", label: "Recently Updated" },
  { value: "dueDate:asc", label: "Due Date" },
  { value: "priority:desc", label: "Priority: High → Low" },
  { value: "priority:asc", label: "Priority: Low → High" },
  { value: "title:asc", label: "Title: A → Z" },
];

const KANBAN_COLUMNS: Array<{
  status: TaskStatus;
  title: string;
  dotClass: string;
}> = [
  { status: "TODO", title: "To Do", dotClass: "bg-slate-400" },
  { status: "IN_PROGRESS", title: "In Progress", dotClass: "bg-blue-500" },
  { status: "DONE", title: "Done", dotClass: "bg-emerald-500" },
];

function parseTaskSortPreset(preset: TaskSortPreset): {
  sortBy: TaskSortBy;
  sortOrder: SortOrder;
} {
  const [sortBy, sortOrder] = preset.split(":") as [TaskSortBy, SortOrder];
  return { sortBy, sortOrder };
}

function getStatusBadge(status: TaskStatus) {
  switch (status) {
    case "DONE":
      return {
        label: "Done",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
      };
    case "IN_PROGRESS":
      return {
        label: "In Progress",
        className: "bg-blue-50 text-blue-700 border-blue-200/80",
      };
    default:
      return {
        label: "To Do",
        className: "bg-slate-100 text-slate-700 border-slate-200/80",
      };
  }
}

function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "HIGH":
      return {
        label: "High",
        className: "bg-rose-100/90 text-rose-700",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        className: "bg-emerald-100/80 text-emerald-800",
      };
    default:
      return {
        label: "Low",
        className: "bg-sky-100/80 text-sky-800",
      };
  }
}

function getKanbanCardSurface(task: Task): string {
  if (task.status === "DONE") {
    return "bg-[#ECFDF5]/85 border-emerald-200/70 hover:border-emerald-300";
  }
  if (task.priority === "HIGH") {
    return "bg-[#FFF1F2]/85 border-rose-200/70 hover:border-rose-300";
  }
  if (task.priority === "MEDIUM") {
    return "bg-[#FEFCE8]/90 border-amber-200/70 hover:border-amber-300";
  }
  return "bg-[#EFF6FF]/85 border-blue-200/70 hover:border-blue-300";
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  // Workspace view mode (Board is default so user sees 3-column Kanban immediately)
  const [viewMode, setViewMode] = useState<WorkspaceViewMode>("board");

  // Filter & pagination state for Tasks
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "ALL">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "ALL">("ALL");
  const [sortPreset, setSortPreset] = useState<TaskSortPreset>("createdAt:desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Modals state
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [createTaskModalStatus, setCreateTaskModalStatus] =
    useState<TaskStatus | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Drag & Drop state for Kanban Board
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [optimisticStatuses, setOptimisticStatuses] = useState<
    Record<string, TaskStatus>
  >({});

  const { sortBy, sortOrder } = parseTaskSortPreset(sortPreset);

  const {
    data: summary,
    isPending: isSummaryPending,
    isError: isSummaryError,
    error: summaryError,
  } = useProjectSummary(projectId);

  // When on Board view, fetch up to 100 tasks across all statuses so all 3 columns populate
  const {
    data: tasksData,
    isPending: isTasksPending,
    isError: isTasksError,
    error: tasksError,
  } = useProjectTasksList(projectId, {
    search: searchInput,
    status: viewMode === "board" ? "ALL" : statusFilter,
    priority: priorityFilter,
    sortBy,
    sortOrder,
    page: viewMode === "board" ? 1 : page,
    limit: viewMode === "board" ? 100 : limit,
  });

  const updateProjectMutation = useUpdateProjectMutation();
  const updateTaskMutation = useUpdateTaskMutation();

  if (isSummaryPending) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="bento-card flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-slate-600"
      >
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" aria-hidden="true" />
        <p className="text-sm font-medium">Loading project...</p>
      </section>
    );
  }

  if (isSummaryError || !summary) {
    return (
      <section
        role="alert"
        className="bento-card flex flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center sm:p-12"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-xl font-semibold text-zinc-900">
          Project not found
        </h1>
        <p className="max-w-md text-sm text-slate-600">
          {getFriendlyErrorMessage(summaryError)}
        </p>
        <Link
          to="/projects"
          className="mt-2 inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Back to Projects</span>
        </Link>
      </section>
    );
  }

  const { project, upcomingTasks } = summary;
  const accentColor = project.color || "#2563eb";
  const isArchived = project.status === "ARCHIVED";

  const rawTasks = tasksData?.tasks ?? [];
  const tasks = rawTasks.map((task) =>
    optimisticStatuses[task.id]
      ? { ...task, status: optimisticStatuses[task.id] }
      : task,
  );

  const pagination = tasksData?.pagination ?? {
    page: 1,
    limit,
    total: 0,
    totalPages: 1,
  };

  const hasActiveTaskFilters =
    searchInput.trim().length > 0 ||
    (viewMode === "list" && statusFilter !== "ALL") ||
    priorityFilter !== "ALL";

  const handleToggleArchive = async () => {
    const nextStatus: ProjectStatus = isArchived ? "ACTIVE" : "ARCHIVED";
    await updateProjectMutation.mutateAsync({
      projectId: project.id,
      payload: { status: nextStatus },
    });
  };

  const handleStatusChange = async (task: Task, nextStatus: TaskStatus) => {
    if (isArchived || task.status === nextStatus) {
      return;
    }

    setOptimisticStatuses((prev) => ({ ...prev, [task.id]: nextStatus }));
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        payload: { status: nextStatus },
      });
    } finally {
      setOptimisticStatuses((prev) => {
        const next = { ...prev };
        delete next[task.id];
        return next;
      });
    }
  };

  const handleColumnDrop = (targetStatus: TaskStatus) => {
    setDragOverColumn(null);
    if (!draggedTaskId || isArchived) {
      setDraggedTaskId(null);
      return;
    }

    const draggedTask = tasks.find((t) => t.id === draggedTaskId);
    setDraggedTaskId(null);

    if (draggedTask && draggedTask.status !== targetStatus) {
      void handleStatusChange(draggedTask, targetStatus);
    }
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
    setSortPreset("createdAt:desc");
    setPage(1);
  };

  const startItemIndex =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItemIndex = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="space-y-3.5">
      {/* Compact Breadcrumb + Archived Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500"
        >
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 transition-colors hover:bg-white hover:text-zinc-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Projects</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate font-semibold text-zinc-900">
            {project.name}
          </span>
        </nav>

        {isArchived ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900">
            <Archive className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
            <span>Archived (Read-only)</span>
            <button
              type="button"
              onClick={() => void handleToggleArchive()}
              disabled={updateProjectMutation.isPending}
              className="ml-1 cursor-pointer font-semibold text-amber-900 underline hover:text-amber-700"
            >
              Restore
            </button>
          </div>
        ) : null}
      </div>

      {/* Compact Project Header Card */}
      <section className="bento-card rounded-3xl p-4 sm:px-6 sm:py-5">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          {/* Left: Badge + Title + Inline Dates */}
          <div className="flex min-w-0 items-center gap-3.5">
            <div
              aria-hidden="true"
              className="font-heading flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              {project.name.trim().charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading truncate text-xl font-semibold text-zinc-900 sm:text-2xl">
                  {project.name}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                    isArchived
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isArchived ? "Archived" : "Active"}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                {project.description ? (
                  <span className="max-w-md truncate text-slate-600">
                    {project.description}
                  </span>
                ) : null}
                {project.startDate || project.dueDate ? (
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    <span>
                      {formatShortDate(project.startDate)} →{" "}
                      <strong
                        className={
                          !isArchived &&
                          project.stats.progress < 100 &&
                          isDateOverdue(project.dueDate)
                            ? "text-red-600"
                            : "text-slate-700"
                        }
                      >
                        {formatShortDate(project.dueDate)}
                      </strong>
                    </span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* Right: Inline Progress + Compact Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 xl:justify-end">
            {/* Inline Progress Pill */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 px-3.5 py-2">
              <div className="min-w-[110px]">
                <div className="flex items-center justify-between text-[11px] font-semibold">
                  <span className="text-slate-500">Progress</span>
                  <span style={{ color: accentColor }}>
                    {project.stats.progress}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${project.stats.progress}%`,
                      backgroundColor: accentColor,
                    }}
                  />
                </div>
              </div>
              <span className="border-l border-slate-200 pl-3 text-xs font-semibold whitespace-nowrap text-slate-700">
                {project.stats.doneTasks}/{project.stats.totalTasks} done
              </span>
            </div>

            {/* Action Buttons (never wrap) */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCreateTaskModalStatus("TODO")}
                disabled={isArchived}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl bg-zinc-900 px-3.5 text-xs font-semibold whitespace-nowrap text-white shadow-xs transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>New Task</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditProjectOpen(true)}
                title="Edit project"
                aria-label="Edit project"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 hover:text-zinc-900"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                type="button"
                onClick={() => void handleToggleArchive()}
                disabled={updateProjectMutation.isPending}
                title={isArchived ? "Restore project" : "Archive project"}
                aria-label={isArchived ? "Restore project" : "Archive project"}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 hover:text-zinc-900 disabled:opacity-50"
              >
                {isArchived ? (
                  <>
                    <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Archive</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteProjectOpen(true)}
                title="Delete project"
                aria-label="Delete project"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-red-200 bg-white text-red-600 transition-colors hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Workspace Toolbar: View Switcher + Search & Filters */}
      <section className="bento-card rounded-2xl p-3 sm:px-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          {/* Left: View Switcher Tabs */}
          <div
            role="tablist"
            aria-label="Workspace view mode"
            className="inline-flex items-center gap-1 self-start rounded-xl bg-slate-100 p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "board"}
              onClick={() => setViewMode("board")}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === "board"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-slate-600 hover:text-zinc-900"
              }`}
            >
              <Kanban className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Board</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "list"}
              onClick={() => setViewMode("list")}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === "list"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-slate-600 hover:text-zinc-900"
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" aria-hidden="true" />
              <span>List</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={viewMode === "overview"}
              onClick={() => setViewMode("overview")}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                viewMode === "overview"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-slate-600 hover:text-zinc-900"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Overview</span>
            </button>
          </div>

          {/* Right: Search & Filter Controls (for Board & List views) */}
          {viewMode !== "overview" ? (
            <div className="flex flex-1 flex-wrap items-center gap-2 lg:justify-end">
              {/* Search by Title */}
              <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => {
                    setSearchInput(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Search tasks..."
                  aria-label="Search tasks"
                  className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-7 pl-8 text-xs text-zinc-900 transition-colors placeholder:text-slate-400 focus:border-zinc-900 focus:bg-white focus:outline-none"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setPage(1);
                    }}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-slate-400 hover:text-zinc-900"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {/* Status Filter (in List view) */}
              {viewMode === "list" ? (
                <select
                  aria-label="Filter by status"
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as TaskStatus | "ALL");
                    setPage(1);
                  }}
                  className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="DONE">Done</option>
                </select>
              ) : null}

              {/* Priority Filter */}
              <div className="relative">
                <Filter
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <select
                  aria-label="Filter by priority"
                  value={priorityFilter}
                  onChange={(event) => {
                    setPriorityFilter(
                      event.target.value as TaskPriority | "ALL",
                    );
                    setPage(1);
                  }}
                  className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-7 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              {/* Sort Select */}
              <div className="relative">
                <ArrowUpDown
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <select
                  aria-label="Sort tasks"
                  value={sortPreset}
                  onChange={(event) => {
                    setSortPreset(event.target.value as TaskSortPreset);
                    setPage(1);
                  }}
                  className="h-9 cursor-pointer rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-7 text-xs font-medium whitespace-nowrap text-slate-700 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none"
                >
                  {TASK_SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {hasActiveTaskFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-9 cursor-pointer rounded-xl px-2.5 text-xs font-semibold whitespace-nowrap text-slate-500 hover:bg-slate-100 hover:text-zinc-900"
                >
                  Reset
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {/* VIEW 1: 3-COLUMN KANBAN BOARD (100% Full Width, Compact Cards) */}
      {viewMode === "board" ? (
        isTasksPending ? (
          <section
            role="status"
            aria-live="polite"
            className="bento-card flex min-h-[360px] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-slate-500"
          >
            <Loader2 className="h-6 w-6 animate-spin text-zinc-900" aria-hidden="true" />
            <p className="text-sm font-medium">Loading board...</p>
          </section>
        ) : isTasksError ? (
          <section
            role="alert"
            className="bento-card rounded-3xl p-8 text-center text-sm font-medium text-red-600"
          >
            {getFriendlyErrorMessage(tasksError)}
          </section>
        ) : (
          <section
            aria-label="Kanban board"
            className="grid grid-cols-1 gap-4 md:grid-cols-3"
          >
            {KANBAN_COLUMNS.map((col) => {
              const columnTasks = tasks.filter((t) => t.status === col.status);
              const isDropTarget = dragOverColumn === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(event) => {
                    if (isArchived) return;
                    event.preventDefault();
                    if (dragOverColumn !== col.status) {
                      setDragOverColumn(col.status);
                    }
                  }}
                  onDragLeave={(event) => {
                    if (
                      !event.currentTarget.contains(
                        event.relatedTarget as Node | null,
                      )
                    ) {
                      setDragOverColumn(null);
                    }
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleColumnDrop(col.status);
                  }}
                  className={`bento-card flex min-h-[420px] flex-col rounded-3xl p-3.5 transition-all ${
                    isDropTarget
                      ? "ring-2 ring-zinc-900 ring-offset-2"
                      : ""
                  }`}
                >
                  {/* Column Header */}
                  <div className="mb-3 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-2.5 w-2.5 rounded-full ${col.dotClass}`}
                      />
                      <h2 className="font-heading text-sm font-semibold text-zinc-900">
                        {col.title}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                        {columnTasks.length}
                      </span>
                    </div>

                    {!isArchived ? (
                      <button
                        type="button"
                        onClick={() => setCreateTaskModalStatus(col.status)}
                        title={`Add task to ${col.title}`}
                        aria-label={`Add task to ${col.title}`}
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-zinc-900"
                      >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>

                  {/* Column Cards */}
                  <div className="flex flex-1 flex-col gap-2.5">
                    {columnTasks.length === 0 ? (
                      <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200/90 bg-slate-50/50 p-6 text-center">
                        <p className="text-xs font-medium text-slate-400">
                          No tasks in {col.title}
                        </p>
                        {!isArchived ? (
                          <button
                            type="button"
                            onClick={() => setCreateTaskModalStatus(col.status)}
                            className="mt-2 inline-flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-white hover:text-zinc-900"
                          >
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Add task</span>
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      columnTasks.map((task) => {
                        const priorityBadge = getPriorityBadge(task.priority);
                        const cardSurface = getKanbanCardSurface(task);
                        const overdue =
                          task.status !== "DONE" && isDateOverdue(task.dueDate);
                        const isDragging = draggedTaskId === task.id;

                        return (
                          <article
                            key={task.id}
                            draggable={!isArchived}
                            onDragStart={(event) => {
                              setDraggedTaskId(task.id);
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", task.id);
                            }}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverColumn(null);
                            }}
                            className={`group rounded-2xl border p-3 shadow-2xs transition-all ${cardSurface} ${
                              !isArchived
                                ? "cursor-grab active:cursor-grabbing"
                                : ""
                            } ${isDragging ? "scale-[0.98] opacity-50" : ""}`}
                          >
                            {/* Row 1: Title + Quick Edit/Delete Actions */}
                            <div className="flex items-start justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingTask(task)}
                                className={`cursor-pointer text-left text-sm leading-snug font-semibold text-zinc-900 hover:underline focus-visible:outline-none ${
                                  task.status === "DONE"
                                    ? "line-through opacity-65"
                                    : ""
                                }`}
                              >
                                {task.title}
                              </button>

                              {!isArchived ? (
                                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                  <button
                                    type="button"
                                    onClick={() => setEditingTask(task)}
                                    title="Edit task"
                                    aria-label={`Edit ${task.title}`}
                                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white/80 text-slate-600 hover:bg-white hover:text-zinc-900"
                                  >
                                    <Pencil className="h-3 w-3" aria-hidden="true" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingTask(task)}
                                    title="Delete task"
                                    aria-label={`Delete ${task.title}`}
                                    className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-lg bg-white/80 text-slate-600 hover:bg-white hover:text-red-600"
                                  >
                                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                                  </button>
                                </div>
                              ) : null}
                            </div>

                            {/* Optional Description */}
                            {task.description ? (
                              <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                                {task.description}
                              </p>
                            ) : null}

                            {/* Bottom Row: Priority Badge + Due Date on the SAME line */}
                            <div className="mt-2.5 flex items-center justify-between gap-2">
                              <span
                                className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${priorityBadge.className}`}
                              >
                                {priorityBadge.label}
                              </span>

                              <div className="flex items-center gap-1.5 text-[11px] font-medium whitespace-nowrap">
                                <Calendar
                                  className={`h-3 w-3 ${
                                    overdue ? "text-red-500" : "text-slate-400"
                                  }`}
                                  aria-hidden="true"
                                />
                                <span
                                  className={
                                    overdue
                                      ? "font-semibold text-red-600"
                                      : "text-slate-600"
                                  }
                                >
                                  {formatShortDate(task.dueDate)}
                                </span>
                                {overdue ? (
                                  <span className="rounded bg-red-100/90 px-1.5 py-0.2 text-[10px] font-semibold text-red-700">
                                    Overdue
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )
      ) : null}

      {/* VIEW 2: FULL-WIDTH PAGINATED TASK LIST (100% Width) */}
      {viewMode === "list" ? (
        <section
          aria-label="Project task list"
          className="bento-card rounded-3xl p-5 sm:p-6"
        >
          {isTasksPending ? (
            <div
              role="status"
              aria-live="polite"
              className="flex min-h-[240px] flex-col items-center justify-center gap-2.5 text-slate-500"
            >
              <Loader2 className="h-5 w-5 animate-spin text-zinc-900" aria-hidden="true" />
              <p className="text-xs font-medium">Loading tasks...</p>
            </div>
          ) : isTasksError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center text-xs font-medium text-red-700"
            >
              {getFriendlyErrorMessage(tasksError)}
            </div>
          ) : tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-zinc-900 shadow-2xs">
                <FolderKanban className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="font-heading text-base font-semibold text-zinc-900">
                {hasActiveTaskFilters ? "No matching tasks" : "No tasks yet"}
              </h3>
              <div className="mt-4 flex justify-center gap-2">
                {hasActiveTaskFilters ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <span>Reset Filters</span>
                  </button>
                ) : !isArchived ? (
                  <button
                    type="button"
                    onClick={() => setCreateTaskModalStatus("TODO")}
                    className="inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
                  >
                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Create First Task</span>
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {tasks.map((task) => {
                const statusBadge = getStatusBadge(task.status);
                const priorityBadge = getPriorityBadge(task.priority);
                const overdue =
                  task.status !== "DONE" && isDateOverdue(task.dueDate);

                return (
                  <article
                    key={task.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 transition-all hover:border-slate-300 hover:bg-white sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTask(task)}
                          className={`cursor-pointer text-left text-sm font-semibold transition-colors hover:underline focus-visible:outline-none ${
                            task.status === "DONE"
                              ? "text-slate-400 line-through"
                              : "text-zinc-900"
                          }`}
                        >
                          {task.title}
                        </button>

                        <span
                          className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${priorityBadge.className}`}
                        >
                          {priorityBadge.label}
                        </span>

                        {overdue ? (
                          <span className="rounded-lg bg-red-50 px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-red-700">
                            Overdue
                          </span>
                        ) : null}
                      </div>

                      {task.description ? (
                        <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                          {task.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Right Side: Due Date + Status Select + Actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2.5">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap ${
                          overdue ? "font-semibold text-red-600" : "text-slate-500"
                        }`}
                      >
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{formatShortDate(task.dueDate)}</span>
                      </span>

                      <select
                        aria-label={`Change status for ${task.title}`}
                        value={task.status}
                        disabled={isArchived}
                        onChange={(event) =>
                          void handleStatusChange(
                            task,
                            event.target.value as TaskStatus,
                          )
                        }
                        className={`h-8 cursor-pointer rounded-xl border px-2.5 text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${statusBadge.className}`}
                      >
                        <option value="TODO">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="DONE">Done</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        disabled={isArchived}
                        title="Edit task"
                        aria-label={`Edit task ${task.title}`}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-100 hover:text-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingTask(task)}
                        disabled={isArchived}
                        title="Delete task"
                        aria-label={`Delete task ${task.title}`}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Server-side Pagination Footer */}
          {pagination.total > 0 ? (
            <div className="mt-5 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:flex-row">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  Showing{" "}
                  <strong className="text-zinc-900">{startItemIndex}</strong>–
                  <strong className="text-zinc-900">{endItemIndex}</strong> of{" "}
                  <strong className="text-zinc-900">{pagination.total}</strong> tasks
                </span>

                <select
                  aria-label="Tasks per page"
                  value={limit}
                  onChange={(event) => {
                    setLimit(Number(event.target.value));
                    setPage(1);
                  }}
                  className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700 focus:border-zinc-900 focus:outline-none"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Prev</span>
                </button>

                <span className="px-2 text-xs font-semibold whitespace-nowrap text-zinc-900">
                  Page {pagination.page} / {pagination.totalPages}
                </span>

                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() =>
                    setPage((prev) =>
                      Math.min(pagination.totalPages, prev + 1),
                    )
                  }
                  className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {/* VIEW 3: PROJECT OVERVIEW (Summary Stats + Upcoming Deadlines) */}
      {viewMode === "overview" ? (
        <div className="space-y-4">
          <section
            aria-label="Project statistics"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div className="bento-card rounded-3xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">
                  Completion
                </span>
                <span
                  className="font-heading text-2xl font-bold"
                  style={{ color: accentColor }}
                >
                  {project.stats.progress}%
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${project.stats.progress}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
              <p className="mt-2.5 text-xs text-slate-500">
                <strong className="text-zinc-900">{project.stats.doneTasks}</strong> of{" "}
                <strong className="text-zinc-900">{project.stats.totalTasks}</strong> completed
              </p>
            </div>

            <div className="bento-card rounded-3xl p-5">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <ListTodo className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-xs font-semibold text-slate-500">To Do</p>
              <p className="font-heading mt-1 text-2xl font-bold text-zinc-900">
                {project.stats.todoTasks}
              </p>
            </div>

            <div className="bento-card rounded-3xl p-5">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CircleDot className="h-4 w-4" aria-hidden="true" />
              </div>
              <p className="text-xs font-semibold text-slate-500">In Progress</p>
              <p className="font-heading mt-1 text-2xl font-bold text-zinc-900">
                {project.stats.inProgressTasks}
              </p>
            </div>

            <div className="bento-card rounded-3xl p-5">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                </div>
                {project.stats.overdueTasks > 0 ? (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                    {project.stats.overdueTasks} overdue
                  </span>
                ) : null}
              </div>
              <p className="text-xs font-semibold text-slate-500">Done</p>
              <p className="font-heading mt-1 text-2xl font-bold text-zinc-900">
                {project.stats.doneTasks}
              </p>
            </div>
          </section>

          <section className="bento-card rounded-3xl p-6">
            <h2 className="font-heading text-base font-semibold text-zinc-900">
              Upcoming Deadlines
            </h2>

            {upcomingTasks.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                No upcoming deadlines for this project.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {upcomingTasks.map((item) => {
                  const overdue = isDateOverdue(item.dueDate);
                  const priorityBadge = getPriorityBadge(item.priority);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-900">
                          {item.title}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                          <Clock className="h-3 w-3 text-slate-400" aria-hidden="true" />
                          <span
                            className={`font-medium ${
                              overdue ? "text-red-600" : "text-slate-500"
                            }`}
                          >
                            {formatShortDate(item.dueDate)}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.2 text-[10px] font-semibold ${priorityBadge.className}`}
                          >
                            {priorityBadge.label}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${
                          overdue
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {overdue ? "Overdue" : "Upcoming"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {/* Create Task Modal */}
      <TaskFormModal
        open={Boolean(createTaskModalStatus)}
        mode="create"
        projectId={project.id}
        projectColor={project.color}
        defaultStatus={createTaskModalStatus ?? "TODO"}
        onClose={() => setCreateTaskModalStatus(null)}
      />

      {/* Edit / View Task Modal */}
      <TaskFormModal
        open={Boolean(editingTask)}
        mode="edit"
        projectId={project.id}
        projectColor={project.color}
        task={editingTask}
        onClose={() => setEditingTask(null)}
      />

      {/* Delete Task Confirmation Dialog */}
      <DeleteTaskDialog
        task={deletingTask}
        onClose={() => setDeletingTask(null)}
      />

      {/* Edit Project Modal */}
      <ProjectFormModal
        open={isEditProjectOpen}
        mode="edit"
        project={project}
        onClose={() => setIsEditProjectOpen(false)}
      />

      {/* Delete Project Confirmation Dialog */}
      <DeleteProjectDialog
        project={isDeleteProjectOpen ? project : null}
        onClose={() => setIsDeleteProjectOpen(false)}
        onDeleted={() => navigate("/projects", { replace: true })}
      />
    </div>
  );
}
