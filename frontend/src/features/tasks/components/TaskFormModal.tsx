import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPlus,
  Clock,
  Loader2,
  Pencil,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { getFriendlyErrorMessage } from "../../../lib/api-client";
import type { TaskPriority, TaskStatus } from "../../../types/project.types";
import type { Task } from "../../../types/task.types";
import { useCreateTaskMutation, useUpdateTaskMutation } from "../hooks/useTasks";
import { type TaskFormValues, taskFormSchema } from "../schemas/task.schema";

interface TaskFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  projectId: string;
  projectColor?: string | null;
  defaultStatus?: TaskStatus;
  task?: Task | null;
  onClose: () => void;
  onSuccess?: (task: Task) => void;
}

const STATUS_OPTIONS: Array<{
  value: TaskStatus;
  label: string;
  activeClass: string;
}> = [
  {
    value: "TODO",
    label: "To Do",
    activeClass: "bg-white text-slate-900 shadow-xs",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
    activeClass: "bg-white text-blue-700 shadow-xs",
  },
  {
    value: "DONE",
    label: "Done",
    activeClass: "bg-white text-emerald-700 shadow-xs",
  },
];

const PRIORITY_OPTIONS: Array<{
  value: TaskPriority;
  label: string;
  activeClass: string;
}> = [
  {
    value: "LOW",
    label: "Low",
    activeClass: "bg-white text-slate-700 shadow-xs",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    activeClass: "bg-white text-amber-700 shadow-xs",
  },
  {
    value: "HIGH",
    label: "High",
    activeClass: "bg-white text-red-700 shadow-xs",
  },
];

function formatDateTimeEnglish(isoStr: string | null | undefined): string {
  if (!isoStr) {
    return "";
  }
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TaskFormModal({
  open,
  mode,
  projectId,
  projectColor,
  defaultStatus = "TODO",
  task,
  onClose,
  onSuccess,
}: TaskFormModalProps) {
  const isEdit = mode === "edit" && Boolean(task);
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      description: "",
      status: defaultStatus,
      priority: "MEDIUM",
      dueDate: "",
    },
  });

  const selectedStatus = useWatch({ control, name: "status" });
  const selectedPriority = useWatch({ control, name: "priority" });

  useEffect(() => {
    if (!open) {
      return;
    }

    if (isEdit && task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ?? "",
      });
    } else {
      reset({
        title: "",
        description: "",
        status: defaultStatus,
        priority: "MEDIUM",
        dueDate: "",
      });
    }
  }, [open, isEdit, task, defaultStatus, reset]);

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
  const accentColor = projectColor || "#2563eb";

  const onSubmit = async (values: TaskFormValues) => {
    const trimmedDescription = values.description.trim();
    const payload = {
      title: values.title.trim(),
      description: trimmedDescription.length > 0 ? trimmedDescription : null,
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate ? values.dueDate : null,
    };

    if (isEdit && task) {
      const updated = await updateMutation.mutateAsync({
        taskId: task.id,
        payload,
      });
      onSuccess?.(updated);
      onClose();
    } else {
      const created = await createMutation.mutateAsync({
        projectId,
        payload,
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
        aria-labelledby="task-modal-title"
        className="bento-card max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl p-6"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-xs"
              style={{ backgroundColor: accentColor }}
            >
              {isEdit ? (
                <Pencil className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ClipboardPlus className="h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <h2
              id="task-modal-title"
              className="font-heading text-xl font-semibold text-zinc-900"
            >
              {isEdit ? "Edit Task" : "New Task"}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close modal"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Metadata bar in edit mode */}
        {isEdit && task ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-3.5 py-2 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
              <span>
                Created:{" "}
                <strong className="text-slate-700">
                  {formatDateTimeEnglish(task.createdAt)}
                </strong>
              </span>
            </span>
            {task.completedAt ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Completed:{" "}
                  <strong>{formatDateTimeEnglish(task.completedAt)}</strong>
                </span>
              </span>
            ) : null}
          </div>
        ) : null}

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
          {/* Task Title */}
          <div>
            <label
              htmlFor="task-title"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="task-title"
              type="text"
              placeholder="e.g. Design new homepage, Fix bug #482..."
              aria-invalid={Boolean(errors.title)}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-zinc-900 transition-colors placeholder:text-slate-400 focus:bg-white focus:outline-none ${
                errors.title
                  ? "border-red-300 bg-red-50/40 focus:border-red-500 focus:ring-3 focus:ring-red-500/15"
                  : "border-slate-200 bg-slate-50/70 focus:border-zinc-900 focus:ring-3 focus:ring-zinc-900/10"
              }`}
              {...register("title")}
            />
            {errors.title ? (
              <p className="mt-1.5 text-xs font-medium text-red-600">
                {errors.title.message}
              </p>
            ) : null}
          </div>

          {/* Task Description */}
          <div>
            <label
              htmlFor="task-description"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Description
            </label>
            <textarea
              id="task-description"
              rows={3}
              placeholder="Optional notes or acceptance criteria..."
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

          {/* Task Status */}
          <div>
            <span className="mb-1.5 block text-xs font-semibold text-slate-700">
              Status
            </span>
            <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
              {STATUS_OPTIONS.map((option) => {
                const active = selectedStatus === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setValue("status", option.value, { shouldValidate: true })
                    }
                    className={`cursor-pointer rounded-xl py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                      active
                        ? option.activeClass
                        : "text-slate-600 hover:text-zinc-900"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700">
                Priority
              </span>
              <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100 p-1.5">
                {PRIORITY_OPTIONS.map((option) => {
                  const active = selectedPriority === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setValue("priority", option.value, {
                          shouldValidate: true,
                        })
                      }
                      className={`cursor-pointer rounded-xl py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                        active
                          ? option.activeClass
                          : "text-slate-600 hover:text-zinc-900"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Due Date
              </label>
              <input
                id="task-due-date"
                type="date"
                aria-invalid={Boolean(errors.dueDate)}
                className={`w-full rounded-xl border px-3.5 py-2 text-sm text-zinc-900 transition-colors focus:bg-white focus:outline-none ${
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

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[40px] cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold whitespace-nowrap text-slate-700 transition-colors hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold whitespace-nowrap text-white transition-colors hover:bg-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>{isEdit ? "Saving..." : "Creating..."}</span>
                </>
              ) : (
                <span>{isEdit ? "Save Changes" : "Create Task"}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
