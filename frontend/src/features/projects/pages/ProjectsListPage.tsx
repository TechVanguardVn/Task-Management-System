import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  FolderKanban,
  FolderPlus,
  Loader2,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import type {
  Project,
  ProjectSortBy,
  ProjectStatus,
  SortOrder,
} from "../../../types/project.types";
import { DeleteProjectDialog } from "../components/DeleteProjectDialog";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { useProjectsList, useUpdateProjectMutation } from "../hooks/useProjects";
import { formatVietnameseDate, isDateOverdue } from "../utils/date.utils";

type StatusFilter = "ALL" | ProjectStatus;

const SORT_OPTIONS: Array<{
  value: `${ProjectSortBy}:${SortOrder}`;
  label: string;
}> = [
  { value: "updatedAt:desc", label: "Cập nhật gần nhất" },
  { value: "createdAt:desc", label: "Mới tạo gần đây" },
  { value: "name:asc", label: "Tên dự án (A → Z)" },
  { value: "dueDate:asc", label: "Hạn hoàn thành gần nhất" },
];

export function ProjectsListPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchInput, setSearchInput] = useState("");
  const [sortOption, setSortOption] =
    useState<`${ProjectSortBy}:${SortOrder}`>("updatedAt:desc");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [sortBy, sortOrder] = sortOption.split(":") as [ProjectSortBy, SortOrder];

  const { data, isPending, isError, error, refetch } = useProjectsList({
    status: statusFilter,
    search: searchInput,
    sortBy,
    sortOrder,
  });

  const updateProjectMutation = useUpdateProjectMutation();

  const projects = data?.projects ?? [];
  const meta = data?.meta ?? { total: 0, activeCount: 0, archivedCount: 0 };

  const handleToggleArchive = async (project: Project) => {
    const nextStatus: ProjectStatus =
      project.status === "ARCHIVED" ? "ACTIVE" : "ARCHIVED";
    await updateProjectMutation.mutateAsync({
      projectId: project.id,
      payload: { status: nextStatus },
    });
  };

  const resetFilters = () => {
    setStatusFilter("ALL");
    setSearchInput("");
    setSortOption("updatedAt:desc");
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Bento Card */}
      <section className="bento-card rounded-3xl p-6 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              <FolderKanban className="h-3.5 w-3.5 text-zinc-900" aria-hidden="true" />
              <span>Không gian dự án cá nhân</span>
            </div>
            <h1 className="font-heading text-2xl font-semibold text-zinc-900 sm:text-3xl">
              Dự án của tôi
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Quản lý tiến độ, thời hạn và tổ chức danh sách công việc theo từng dự án độc lập.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            <FolderPlus className="h-4 w-4" aria-hidden="true" />
            <span>Tạo dự án mới</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Segmented Tabs */}
          <div
            role="tablist"
            aria-label="Lọc dự án theo trạng thái"
            className="inline-flex flex-wrap items-center gap-1.5 rounded-2xl bg-slate-100 p-1.5"
          >
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "ALL"}
              onClick={() => setStatusFilter("ALL")}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                statusFilter === "ALL"
                  ? "bg-white text-zinc-900 shadow-xs"
                  : "text-slate-600 hover:text-zinc-900"
              }`}
            >
              Tất cả ({meta.total})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "ACTIVE"}
              onClick={() => setStatusFilter("ACTIVE")}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                statusFilter === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-zinc-900"
              }`}
            >
              Đang hoạt động ({meta.activeCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={statusFilter === "ARCHIVED"}
              onClick={() => setStatusFilter("ARCHIVED")}
              className={`cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                statusFilter === "ARCHIVED"
                  ? "bg-white text-amber-700 shadow-xs"
                  : "text-slate-600 hover:text-zinc-900"
              }`}
            >
              Đã lưu trữ ({meta.archivedCount})
            </button>
          </div>

          {/* Search & Sort Controls */}
          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center lg:max-w-xl lg:justify-end">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên hoặc mô tả dự án..."
                aria-label="Tìm kiếm dự án"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 pr-9 pl-10 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:border-zinc-900 focus:bg-white focus:ring-3 focus:ring-zinc-900/10 focus:outline-none"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  aria-label="Xóa từ khóa tìm kiếm"
                  className="absolute top-1/2 right-2.5 flex h-6 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>

            <select
              value={sortOption}
              onChange={(e) =>
                setSortOption(e.target.value as `${ProjectSortBy}:${SortOrder}`)
              }
              aria-label="Sắp xếp dự án"
              className="min-h-[42px] cursor-pointer rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors focus:border-zinc-900 focus:bg-white focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isPending ? (
        <section
          role="status"
          aria-live="polite"
          className="bento-card flex min-h-[260px] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-slate-600"
        >
          <Loader2 className="h-6 w-6 animate-spin text-zinc-900" aria-hidden="true" />
          <p className="text-sm font-medium">Đang tải danh sách dự án...</p>
        </section>
      ) : isError ? (
        /* Error State */
        <section
          role="alert"
          className="bento-card flex flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <p className="font-heading text-base font-semibold text-zinc-900">
            Không thể tải danh sách dự án
          </p>
          <p className="max-w-md text-xs text-slate-600">
            {getFriendlyErrorMessage(error)}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-1 cursor-pointer rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
          >
            Thử lại
          </button>
        </section>
      ) : projects.length === 0 ? (
        /* Empty States */
        meta.total === 0 ? (
          <section className="bento-card rounded-3xl p-8 text-center sm:p-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-zinc-900">
              <FolderKanban className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="font-heading text-xl font-semibold text-zinc-900 sm:text-2xl">
              Bạn chưa có dự án nào
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
              Hãy khởi tạo dự án đầu tiên (ví dụ: Website E-commerce, Nghiên cứu khoa học) để bắt đầu thêm và theo dõi các công việc bên trong.
            </p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              <span>Tạo dự án đầu tiên</span>
            </button>
          </section>
        ) : (
          <section className="bento-card rounded-3xl p-8 text-center sm:p-10">
            <p className="font-heading text-lg font-semibold text-zinc-900">
              Không tìm thấy dự án phù hợp
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
              Không có dự án nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-900 hover:bg-slate-50"
            >
              Xóa bộ lọc tìm kiếm
            </button>
          </section>
        )
      ) : (
        /* Projects Bento Grid */
        <section
          aria-label="Danh sách dự án"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {projects.map((project) => {
            const accentColor = project.color || "#2563eb";
            const isArchived = project.status === "ARCHIVED";
            const dueOverdue =
              !isArchived &&
              project.stats.progress < 100 &&
              isDateOverdue(project.dueDate);

            return (
              <article
                key={project.id}
                className="bento-card flex flex-col justify-between rounded-3xl p-6 transition-all hover:border-slate-300/80"
              >
                <div>
                  {/* Card Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        aria-hidden="true"
                        className="h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center text-white font-heading font-bold text-sm shadow-xs"
                        style={{ backgroundColor: accentColor }}
                      >
                        {project.name.trim().charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <Link
                          to={`/projects/${project.id}`}
                          className="font-heading block truncate text-lg font-semibold text-zinc-900 transition-colors hover:text-blue-600 focus-visible:underline focus-visible:outline-none"
                        >
                          {project.name}
                        </Link>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              isArchived
                                ? "bg-amber-50 text-amber-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {isArchived ? "Đã lưu trữ" : "Đang hoạt động"}
                          </span>
                          {project.stats.overdueTasks > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {project.stats.overdueTasks} quá hạn
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingProject(project)}
                        title="Chỉnh sửa dự án"
                        aria-label={`Chỉnh sửa dự án ${project.name}`}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-zinc-900"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleArchive(project)}
                        disabled={updateProjectMutation.isPending}
                        title={
                          isArchived ? "Khôi phục dự án" : "Lưu trữ dự án (Archive)"
                        }
                        aria-label={
                          isArchived
                            ? `Khôi phục dự án ${project.name}`
                            : `Lưu trữ dự án ${project.name}`
                        }
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-zinc-900 disabled:opacity-50"
                      >
                        {isArchived ? (
                          <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingProject(project)}
                        title="Xóa dự án"
                        aria-label={`Xóa dự án ${project.name}`}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="mt-3.5 line-clamp-2 min-h-[40px] text-xs leading-relaxed text-slate-600">
                    {project.description
                      ? project.description
                      : "Chưa có mô tả chi tiết cho dự án này."}
                  </p>

                  {/* Progress Bar & Stats */}
                  <div className="mt-4 rounded-2xl bg-slate-50/90 p-3.5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        Tiến độ hoàn thành
                      </span>
                      <span className="font-heading font-bold text-zinc-900">
                        {project.stats.progress}%
                      </span>
                    </div>

                    <div
                      role="progressbar"
                      aria-valuenow={project.stats.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Tiến độ dự án ${project.name}`}
                      className="h-2 w-full overflow-hidden rounded-full bg-slate-200/80"
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${project.stats.progress}%`,
                          backgroundColor: accentColor,
                        }}
                      />
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-medium text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle2
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-hidden="true"
                        />
                        <span>
                          {project.stats.doneTasks}/{project.stats.totalTasks} hoàn thành
                        </span>
                      </span>
                      <span>
                        Đang làm: <strong>{project.stats.inProgressTasks}</strong> · Chờ:{" "}
                        <strong>{project.stats.todoTasks}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className={dueOverdue ? "font-semibold text-red-600" : ""}>
                      Hạn: {formatVietnameseDate(project.dueDate)}
                    </span>
                  </div>

                  <Link
                    to={`/projects/${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-semibold text-zinc-900 transition-colors hover:bg-slate-100"
                  >
                    <span>Mở dự án</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      {/* Create Project Modal */}
      <ProjectFormModal
        open={isCreateOpen}
        mode="create"
        onClose={() => setIsCreateOpen(false)}
      />

      {/* Edit Project Modal */}
      <ProjectFormModal
        open={Boolean(editingProject)}
        mode="edit"
        project={editingProject}
        onClose={() => setEditingProject(null)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        project={deletingProject}
        onClose={() => setDeletingProject(null)}
      />
    </div>
  );
}
