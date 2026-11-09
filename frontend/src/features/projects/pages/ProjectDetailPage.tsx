import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  CircleDot,
  Clock,
  FolderKanban,
  ListTodo,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import type {
  ProjectStatus,
  TaskPriority,
  TaskStatus,
} from "../../../types/project.types";
import { DeleteProjectDialog } from "../components/DeleteProjectDialog";
import { ProjectFormModal } from "../components/ProjectFormModal";
import { useProjectSummary, useUpdateProjectMutation } from "../hooks/useProjects";
import { formatVietnameseDate, isDateOverdue } from "../utils/date.utils";

function getStatusBadge(status: TaskStatus) {
  switch (status) {
    case "DONE":
      return {
        label: "Hoàn thành",
        className: "bg-emerald-50 text-emerald-700",
      };
    case "IN_PROGRESS":
      return {
        label: "Đang thực hiện",
        className: "bg-blue-50 text-blue-700",
      };
    default:
      return {
        label: "Chưa bắt đầu",
        className: "bg-slate-100 text-slate-700",
      };
  }
}

function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "HIGH":
      return {
        label: "Ưu tiên Cao",
        className: "bg-red-50 text-red-700",
      };
    case "MEDIUM":
      return {
        label: "Trung bình",
        className: "bg-amber-50 text-amber-700",
      };
    default:
      return {
        label: "Thấp",
        className: "bg-slate-100 text-slate-600",
      };
  }
}

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const { data: summary, isPending, isError, error } = useProjectSummary(projectId);
  const updateProjectMutation = useUpdateProjectMutation();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  if (isPending) {
    return (
      <section
        role="status"
        aria-live="polite"
        className="bento-card flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-3xl p-8 text-slate-600"
      >
        <Loader2 className="h-6 w-6 animate-spin text-zinc-900" aria-hidden="true" />
        <p className="text-sm font-medium">Đang tải thông tin dự án...</p>
      </section>
    );
  }

  if (isError || !summary) {
    return (
      <section
        role="alert"
        className="bento-card flex flex-col items-center justify-center gap-3 rounded-3xl p-8 text-center sm:p-12"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-heading text-xl font-semibold text-zinc-900">
          Không tìm thấy dự án
        </h1>
        <p className="max-w-md text-sm text-slate-600">
          {getFriendlyErrorMessage(error)}
        </p>
        <Link
          to="/projects"
          className="mt-2 inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Quay lại danh sách dự án</span>
        </Link>
      </section>
    );
  }

  const { project, upcomingTasks, recentTasks } = summary;
  const accentColor = project.color || "#2563eb";
  const isArchived = project.status === "ARCHIVED";

  const handleToggleArchive = async () => {
    const nextStatus: ProjectStatus = isArchived ? "ACTIVE" : "ARCHIVED";
    await updateProjectMutation.mutateAsync({
      projectId: project.id,
      payload: { status: nextStatus },
    });
  };

  return (
    <div className="space-y-4">
      {/* Breadcrumb Bar */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 px-1 text-xs font-medium text-slate-500">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-slate-600 transition-colors hover:bg-white hover:text-zinc-900"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Dự án của tôi</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate font-semibold text-zinc-900">{project.name}</span>
      </nav>

      {/* Archived Notice Banner */}
      {isArchived ? (
        <div
          role="status"
          className="bento-card flex flex-col justify-between gap-3 rounded-2xl border border-amber-200/90 bg-amber-50/90 px-5 py-3.5 sm:flex-row sm:items-center"
        >
          <div className="flex items-center gap-2.5 text-xs font-medium text-amber-900">
            <Archive className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>
              Dự án này đang ở trạng thái <strong>Đã lưu trữ (Archived)</strong>. Bạn có thể xem lại dữ liệu nhưng không thể thêm hoặc cập nhật công việc cho đến khi khôi phục.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void handleToggleArchive()}
            disabled={updateProjectMutation.isPending}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-amber-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-800 disabled:opacity-60"
          >
            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Khôi phục dự án</span>
          </button>
        </div>
      ) : null}

      {/* Project Hero Bento Card */}
      <section className="bento-card rounded-3xl p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div className="flex items-start gap-4 min-w-0">
            <div
              aria-hidden="true"
              className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl font-heading text-xl font-bold text-white shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              {project.name.trim().charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-heading text-2xl font-semibold text-zinc-900 sm:text-3xl">
                  {project.name}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    isArchived
                      ? "bg-amber-50 text-amber-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {isArchived ? "Đã lưu trữ" : "Đang hoạt động"}
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                {project.description
                  ? project.description
                  : "Chưa có mô tả chi tiết cho dự án này."}
              </p>

              {/* Timeline Metadata */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>
                    Ngày bắt đầu:{" "}
                    <strong className="text-slate-700">
                      {formatVietnameseDate(project.startDate)}
                    </strong>
                  </span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span>
                    Hạn hoàn thành:{" "}
                    <strong
                      className={
                        !isArchived &&
                        project.stats.progress < 100 &&
                        isDateOverdue(project.dueDate)
                          ? "text-red-600"
                          : "text-slate-700"
                      }
                    >
                      {formatVietnameseDate(project.dueDate)}
                    </strong>
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-zinc-900"
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Chỉnh sửa</span>
            </button>

            <button
              type="button"
              onClick={() => void handleToggleArchive()}
              disabled={updateProjectMutation.isPending}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-zinc-900 disabled:opacity-50"
            >
              {isArchived ? (
                <>
                  <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Khôi phục</span>
                </>
              ) : (
                <>
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Lưu trữ</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteOpen(true)}
              className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Xóa dự án</span>
            </button>
          </div>
        </div>
      </section>

      {/* Project Dashboard Summary Grid (Section 6.2) */}
      <section
        aria-label="Thống kê tiến độ dự án"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {/* Progress Card */}
        <div className="bento-card rounded-3xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Tiến độ dự án
            </span>
            <span
              className="font-heading text-2xl font-bold"
              style={{ color: accentColor }}
            >
              {project.stats.progress}%
            </span>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${project.stats.progress}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
          <p className="mt-2.5 text-xs text-slate-500">
            Đã xong{" "}
            <strong className="text-zinc-900">{project.stats.doneTasks}</strong> /{" "}
            <strong className="text-zinc-900">{project.stats.totalTasks}</strong> công việc
          </p>
        </div>

        {/* TODO Card */}
        <div className="bento-card rounded-3xl p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <ListTodo className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-slate-500">Chưa bắt đầu (TODO)</p>
          <p className="font-heading mt-1 text-2xl font-bold text-zinc-900">
            {project.stats.todoTasks}
          </p>
        </div>

        {/* IN_PROGRESS Card */}
        <div className="bento-card rounded-3xl p-5">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CircleDot className="h-4 w-4" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Đang thực hiện (IN_PROGRESS)
          </p>
          <p className="font-heading mt-1 text-2xl font-bold text-zinc-900">
            {project.stats.inProgressTasks}
          </p>
        </div>

        {/* DONE & Overdue Card */}
        <div className="bento-card rounded-3xl p-5">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
            {project.stats.overdueTasks > 0 ? (
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-700">
                {project.stats.overdueTasks} quá hạn
              </span>
            ) : null}
          </div>
          <p className="text-xs font-semibold text-slate-500">Đã hoàn thành (DONE)</p>
          <p className="font-heading mt-1 text-2xl font-bold text-zinc-900">
            {project.stats.doneTasks}
          </p>
        </div>
      </section>

      {/* Project Overview Content: Upcoming Deadlines & Task List */}
      {project.stats.totalTasks === 0 ? (
        <section className="bento-card rounded-3xl p-8 text-center sm:p-10">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-zinc-900">
            <FolderKanban className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="font-heading text-lg font-semibold text-zinc-900">
            Dự án này chưa có công việc nào
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-600">
            Tiến độ hiện tại là <strong>0%</strong>. Chức năng tạo, cập nhật và lọc công việc (Task CRUD) sẽ được kết nối ngay ở giai đoạn kế tiếp (<code>feature/tasks</code>).
          </p>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Recent Tasks in Project */}
          <section className="bento-card rounded-3xl p-6 lg:col-span-7">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-heading text-base font-semibold text-zinc-900">
                  Công việc trong dự án ({project.stats.totalTasks})
                </h2>
                <p className="text-xs text-slate-500">
                  Danh sách các công việc thuộc dự án {project.name}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {recentTasks.map((task) => {
                const statusBadge = getStatusBadge(task.status);
                const priorityBadge = getPriorityBadge(task.priority);
                const overdue =
                  task.status !== "DONE" && isDateOverdue(task.dueDate);

                return (
                  <div
                    key={task.id}
                    className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm font-semibold ${
                          task.status === "DONE"
                            ? "text-slate-400 line-through"
                            : "text-zinc-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span>
                          Hạn:{" "}
                          <strong className={overdue ? "text-red-600" : "text-slate-700"}>
                            {formatVietnameseDate(task.dueDate)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${priorityBadge.className}`}
                      >
                        {priorityBadge.label}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Upcoming Deadlines in Project */}
          <section className="bento-card rounded-3xl p-6 lg:col-span-5">
            <h2 className="font-heading text-base font-semibold text-zinc-900">
              Sắp đến hạn &amp; Cần chú ý
            </h2>
            <p className="text-xs text-slate-500">
              Các công việc chưa hoàn thành có gắn hạn chót
            </p>

            {upcomingTasks.length === 0 ? (
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                Không có công việc nào sắp đến hạn.
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {upcomingTasks.map((task) => {
                  const overdue = isDateOverdue(task.dueDate);
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-zinc-900">
                          {task.title}
                        </p>
                        <p
                          className={`mt-0.5 text-[11px] font-medium ${
                            overdue ? "text-red-600" : "text-slate-500"
                          }`}
                        >
                          {overdue ? "Quá hạn: " : "Hạn chót: "}
                          {formatVietnameseDate(task.dueDate)}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          overdue
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {overdue ? "Quá hạn" : "Sắp tới"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Edit Modal */}
      <ProjectFormModal
        open={isEditOpen}
        mode="edit"
        project={project}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteProjectDialog
        project={isDeleteOpen ? project : null}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => navigate("/projects", { replace: true })}
      />
    </div>
  );
}
