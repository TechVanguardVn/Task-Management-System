import { useId, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { normalizeApiError } from "../../lib/api-errors";
import type { TaskFieldName } from "../../lib/api-errors";
import { localInputToUtcIso, utcIsoToLocalInput } from "../../lib/date";
import { cn } from "../../lib/utils";
import type {
  Task,
  TaskPriority,
  TaskStatus,
  TaskUpdatePayload,
} from "../../types/task";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { TaskDialog } from "./TaskDialog";

const STATUS_OPTIONS: ReadonlyArray<{ value: TaskStatus; label: string }> = [
  { value: "TODO", label: "Cần làm" },
  { value: "IN_PROGRESS", label: "Đang làm" },
  { value: "DONE", label: "Hoàn thành" },
];

const PRIORITY_OPTIONS: ReadonlyArray<{
  value: TaskPriority;
  label: string;
}> = [
  { value: "HIGH", label: "Cao" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "LOW", label: "Thấp" },
];

const TASK_FIELDS: ReadonlyArray<TaskFieldName> = [
  "title",
  "description",
  "status",
  "priority",
  "due_date",
];

interface TaskFormValues {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
}

interface TaskFormModalProps {
  mode: "create" | "edit";
  task?: Task;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskUpdatePayload) => Promise<void>;
}

function getInitialValues(mode: "create" | "edit", task?: Task): TaskFormValues {
  if (mode === "edit" && task) {
    return {
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: utcIsoToLocalInput(task.due_date),
    };
  }

  return {
    title: "",
    description: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
  };
}

function isTaskField(value: string): value is TaskFieldName {
  return TASK_FIELDS.some((field) => field === value);
}

function getSubmitErrorMessage(error: unknown): string {
  const apiError = normalizeApiError(error);

  if (apiError.isNetworkError) {
    return "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.";
  }

  if (apiError.status === 404) {
    return "Công việc không còn tồn tại. Hãy đóng hộp thoại và tải lại danh sách.";
  }

  return "Không thể lưu công việc. Vui lòng thử lại.";
}

interface FormSelectProps {
  label: string;
  value: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  children: ReactNode;
}

function FormSelect({
  label,
  value,
  error,
  disabled,
  onChange,
  children,
}: FormSelectProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="grid gap-1.5">
      <label
        htmlFor={id}
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-10 w-full rounded-xl border bg-surface px-3 text-sm text-ink shadow-xs transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-55",
          error
            ? "border-danger focus-visible:border-danger focus-visible:ring-danger"
            : "border-line hover:border-line-strong focus-visible:border-accent focus-visible:ring-accent",
        )}
      >
        {children}
      </select>
      {error ? (
        <p id={errorId} className="text-xs font-medium leading-5 text-danger-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TaskFormModal({
  mode,
  task,
  isSubmitting,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const titleId = useId();
  const formErrorId = useId();
  const descriptionId = useId();
  const descriptionErrorId = `${descriptionId}-error`;
  const submittingRef = useRef(false);
  const [values, setValues] = useState<TaskFormValues>(() =>
    getInitialValues(mode, task),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<TaskFieldName, string>>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = mode === "edit";
  const isPending = isSubmitting;

  function updateValue<K extends keyof TaskFormValues>(
    field: K,
    value: TaskFormValues[K],
  ) {
    setValues((current) => ({ ...current, [field]: value }));

    const payloadField = field === "dueDate" ? "due_date" : field;

    if (payloadField !== "dueDate" && isTaskField(payloadField)) {
      setFieldErrors((current) => {
        if (!current[payloadField]) {
          return current;
        }

        const next = { ...current };
        delete next[payloadField];
        return next;
      });
    }

    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submittingRef.current || isPending) {
      return;
    }

    const nextErrors: Partial<Record<TaskFieldName, string>> = {};
    const title = values.title.trim();
    const description = values.description.trim();

    if (!title) {
      nextErrors.title = "Vui lòng nhập tiêu đề công việc.";
    } else if (title.length > 200) {
      nextErrors.title = "Tiêu đề không được vượt quá 200 ký tự.";
    }

    const dueDate = values.dueDate.trim();
    const dueDateIso = dueDate ? localInputToUtcIso(dueDate) : null;

    if (dueDate && !dueDateIso) {
      nextErrors.due_date = "Hạn chót không hợp lệ.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setFormError("Vui lòng kiểm tra các trường được đánh dấu.");
      return;
    }

    submittingRef.current = true;
    setFieldErrors({});
    setFormError(null);

    try {
      await onSubmit({
        title,
        description: description || null,
        status: values.status,
        priority: values.priority,
        due_date: dueDateIso,
      });
    } catch (error) {
      const apiError = normalizeApiError(error);
      const nextFieldErrors: Partial<Record<TaskFieldName, string>> = {};

      for (const [field, message] of Object.entries(apiError.fieldErrors)) {
        if (message && isTaskField(field)) {
          nextFieldErrors[field] = message;
        }
      }

      setFieldErrors(nextFieldErrors);
      setFormError(
        Object.keys(nextFieldErrors).length > 0
          ? "Vui lòng kiểm tra các trường được đánh dấu."
          : getSubmitErrorMessage(error),
      );
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <TaskDialog
      title={isEditing ? "Chỉnh sửa công việc" : "Tạo công việc"}
      titleId={titleId}
      descriptionId={formError ? formErrorId : undefined}
      eyebrow="Công việc"
      size="lg"
      onClose={onClose}
      isBusy={isPending}
    >
      <form noValidate onSubmit={handleSubmit} className="grid gap-5">
        <Input
          label="Tiêu đề"
          value={values.title}
          maxLength={200}
          disabled={isPending}
          data-dialog-initial-focus
          error={fieldErrors.title}
          onChange={(event) => updateValue("title", event.target.value)}
        />

        <div className="grid gap-1.5">
          <label
            htmlFor={descriptionId}
            className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted"
          >
            Mô tả
          </label>
          <textarea
            id={descriptionId}
            rows={4}
            value={values.description}
            disabled={isPending}
            aria-invalid={fieldErrors.description ? true : undefined}
            aria-describedby={
              fieldErrors.description ? descriptionErrorId : undefined
            }
            onChange={(event) => updateValue("description", event.target.value)}
            className={cn(
              "w-full resize-y rounded-xl border bg-surface px-3 py-2.5 text-sm leading-6 text-ink shadow-xs transition-colors duration-150 placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-55",
              fieldErrors.description
                ? "border-danger focus-visible:border-danger focus-visible:ring-danger"
                : "border-line hover:border-line-strong focus-visible:border-accent focus-visible:ring-accent",
            )}
          />
          {fieldErrors.description ? (
            <p
              id={descriptionErrorId}
              className="text-xs font-medium leading-5 text-danger-strong"
            >
              {fieldErrors.description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelect
            label="Trạng thái"
            value={values.status}
            error={fieldErrors.status}
            disabled={isPending}
            onChange={(value) =>
              updateValue("status", value as TaskStatus)
            }
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>

          <FormSelect
            label="Mức ưu tiên"
            value={values.priority}
            error={fieldErrors.priority}
            disabled={isPending}
            onChange={(value) =>
              updateValue("priority", value as TaskPriority)
            }
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
        </div>

        <Input
          label="Hạn chót"
          type="datetime-local"
          value={values.dueDate}
          disabled={isPending}
          error={fieldErrors.due_date}
          hint="Dùng giờ địa phương của trình duyệt."
          onChange={(event) => updateValue("dueDate", event.target.value)}
        />

        {formError ? (
          <p
            id={formErrorId}
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-6 text-red-700"
          >
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button type="submit" isLoading={isPending}>
            {isEditing ? "Lưu thay đổi" : "Tạo công việc"}
          </Button>
        </div>
      </form>
    </TaskDialog>
  );
}
