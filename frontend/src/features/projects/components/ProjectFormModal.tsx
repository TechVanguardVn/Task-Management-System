import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Check, FolderPlus, Loader2, Pencil, X } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import { PROJECT_COLOR_PRESETS, type Project } from "../../../types/project.types";
import { toProjectPayload } from "../api/projects.api";
import { useCreateProjectMutation, useUpdateProjectMutation } from "../hooks/useProjects";
import { type ProjectFormValues, projectFormSchema } from "../schemas/project.schema";

interface ProjectFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  project?: Project | null;
  onClose: () => void;
  onSuccess?: (project: Project) => void;
}

export function ProjectFormModal({
  open,
  mode,
  project,
  onClose,
  onSuccess,
}: ProjectFormModalProps) {
  const isEdit = mode === "edit" && Boolean(project);
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: PROJECT_COLOR_PRESETS[0].value,
      status: "ACTIVE",
      startDate: "",
      dueDate: "",
    },
  });

  const selectedColor = useWatch({ control, name: "color" });
  const selectedStatus = useWatch({ control, name: "status" });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isEdit && project) {
      reset({
        name: project.name,
        description: project.description ?? "",
        color: project.color ?? PROJECT_COLOR_PRESETS[0].value,
        status: project.status,
        startDate: project.startDate ?? "",
        dueDate: project.dueDate ?? "",
      });
    } else {
      reset({
        name: "",
        description: "",
        color: PROJECT_COLOR_PRESETS[0].value,
        status: "ACTIVE",
        startDate: "",
        dueDate: "",
      });
    }
  }, [open, isEdit, project, reset]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const activeError = isEdit ? updateMutation.error : createMutation.error;
  const serverError = activeError ? getFriendlyErrorMessage(activeError) : null;

  const onSubmit = async (values: ProjectFormValues) => {
    const payload = toProjectPayload(values);
    if (isEdit && project) {
      const updated = await updateMutation.mutateAsync({
        projectId: project.id,
        payload,
      });
      onSuccess?.(updated);
      onClose();
    } else {
      const created = await createMutation.mutateAsync({
        name: payload.name,
        description: payload.description,
        color: payload.color,
        startDate: payload.startDate,
        dueDate: payload.dueDate,
      });
      onSuccess?.(created);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
        className="bento-card max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 sm:p-7"
      >
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-xs"
              style={{ backgroundColor: selectedColor || "#2563eb" }}
            >
              {isEdit ? (
                <Pencil className="h-4 w-4" aria-hidden="true" />
              ) : (
                <FolderPlus className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div>
              <h2
                id="project-modal-title"
                className="font-heading text-xl font-semibold text-zinc-900"
              >
                {isEdit ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEdit
                  ? "Cập nhật thông tin, màu nhận diện hoặc thời hạn dự án."
                  : "Tạo không gian riêng để tổ chức và theo dõi các công việc."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Đóng hộp thoại"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {serverError ? (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/90 p-3.5 text-xs font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            <span>{serverError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Project Name */}
          <div>
            <label
              htmlFor="project-name"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Tên dự án <span className="text-red-500">*</span>
            </label>
            <input
              id="project-name"
              type="text"
              placeholder="Ví dụ: Website Thương mại Điện tử, Nghiên cứu AI..."
              aria-invalid={Boolean(errors.name)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:outline-none ${
                errors.name
                  ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-3 focus:ring-red-500/15"
                  : "border-slate-200 bg-slate-50/70 focus:border-zinc-900 focus:ring-3 focus:ring-zinc-900/10"
              }`}
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          {/* Project Description */}
          <div>
            <label
              htmlFor="project-description"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Mô tả dự án
            </label>
            <textarea
              id="project-description"
              rows={3}
              placeholder="Ghi chú mục tiêu, phạm vi hoặc các cột mốc chính của dự án..."
              aria-invalid={Boolean(errors.description)}
              className={`w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:outline-none ${
                errors.description
                  ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-3 focus:ring-red-500/15"
                  : "border-slate-200 bg-slate-50/70 focus:border-zinc-900 focus:ring-3 focus:ring-zinc-900/10"
              }`}
              {...register("description")}
            />
            {errors.description ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.description.message}
              </p>
            ) : null}
          </div>

          {/* Color Picker */}
          <div>
            <span className="mb-2 block text-xs font-semibold text-slate-700">
              Màu nhận diện
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              {PROJECT_COLOR_PRESETS.map((preset) => {
                const isSelected =
                  selectedColor?.toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() =>
                      setValue("color", preset.value, { shouldValidate: true })
                    }
                    title={preset.label}
                    aria-label={`Chọn màu ${preset.label}`}
                    aria-pressed={isSelected}
                    className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-transform focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none ${
                      isSelected ? "scale-105 ring-2 ring-zinc-900 ring-offset-2" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: preset.value }}
                  >
                    {isSelected ? (
                      <Check className="h-4 w-4 text-white" aria-hidden="true" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates Row */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="project-start-date"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Ngày bắt đầu
              </label>
              <input
                id="project-start-date"
                type="date"
                aria-invalid={Boolean(errors.startDate)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:border-zinc-900 focus:bg-white focus:ring-3 focus:ring-zinc-900/10 focus:outline-none"
                {...register("startDate")}
              />
              {errors.startDate ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.startDate.message}
                </p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="project-due-date"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Hạn hoàn thành
              </label>
              <input
                id="project-due-date"
                type="date"
                aria-invalid={Boolean(errors.dueDate)}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 transition-colors focus:bg-white focus:outline-none ${
                  errors.dueDate
                    ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-3 focus:ring-red-500/15"
                    : "border-slate-200 bg-slate-50/70 focus:border-zinc-900 focus:ring-3 focus:ring-zinc-900/10"
                }`}
                {...register("dueDate")}
              />
              {errors.dueDate ? (
                <p className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.dueDate.message}
                </p>
              ) : null}
            </div>
          </div>

          {/* Status Toggle in Edit Mode */}
          {isEdit ? (
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Trạng thái dự án
              </span>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setValue("status", "ACTIVE", { shouldValidate: true })
                  }
                  className={`cursor-pointer rounded-xl py-2 text-xs font-semibold transition-all ${
                    selectedStatus === "ACTIVE"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-600 hover:text-zinc-900"
                  }`}
                >
                  Đang hoạt động
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setValue("status", "ARCHIVED", { shouldValidate: true })
                  }
                  className={`cursor-pointer rounded-xl py-2 text-xs font-semibold transition-all ${
                    selectedStatus === "ARCHIVED"
                      ? "bg-white text-amber-700 shadow-xs"
                      : "text-slate-600 hover:text-zinc-900"
                  }`}
                >
                  Đã lưu trữ (Archive)
                </button>
              </div>
            </div>
          ) : null}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[42px] cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{isEdit ? "Đang lưu..." : "Đang tạo..."}</span>
                </>
              ) : (
                <span>{isEdit ? "Lưu thay đổi" : "Tạo dự án"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
