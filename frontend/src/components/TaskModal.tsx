import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getApiFieldErrors } from "../lib/task";
import type { Task, TaskInput } from "../types";

const schema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tiêu đề")
    .max(255, "Tối đa 255 ký tự"),
  description: z.string(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  dueDate: z.string(),
});
type Values = z.infer<typeof schema>;

const getToday = () => {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

export function TaskModal({
  task,
  onClose,
  onSave,
}: {
  task?: Task;
  onClose: () => void;
  onSave: (input: TaskInput) => Promise<void>;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task?.title || "",
      description: task?.description || "",
      status: task?.status || "TODO",
      priority: task?.priority || "MEDIUM",
      dueDate: task?.dueDate || getToday(),
    },
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const submit = form.handleSubmit(async (values) => {
    try {
      await onSave({ ...values, dueDate: values.dueDate || getToday() });
    } catch (error) {
      const errors = getApiFieldErrors(error);
      Object.entries(errors).forEach(([field, message]) =>
        form.setError(field as keyof Values, { message }),
      );
      if (!Object.keys(errors).length)
        form.setError("root", {
          message: "Không thể lưu công việc. Vui lòng thử lại.",
        });
    }
  });
  const input =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm";
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-900/40 sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <button
        aria-label="Đóng"
        className="absolute inset-0"
        onClick={onClose}
      />
      <form
        onSubmit={submit}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white p-5 shadow-xl sm:max-w-lg sm:rounded-lg"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="task-modal-title" className="text-lg font-bold">
            {task ? "Chỉnh sửa công việc" : "Tạo công việc"}
          </h2>
          <button type="button" aria-label="Đóng" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="title" className="text-sm font-medium">
              Tiêu đề
            </label>
            <input
              id="title"
              autoFocus
              className={input}
              {...form.register("title")}
            />
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.title?.message}
            </p>
          </div>
          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Mô tả
            </label>
            <textarea
              id="description"
              rows={3}
              className={input}
              {...form.register("description")}
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className="text-sm font-medium">
                Trạng thái
              </label>
              <select
                id="status"
                className={input}
                {...form.register("status")}
              >
                <option value="TODO">Cần làm</option>
                <option value="IN_PROGRESS">Đang làm</option>
                <option value="DONE">Hoàn thành</option>
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="text-sm font-medium">
                Mức ưu tiên
              </label>
              <select
                id="priority"
                className={input}
                {...form.register("priority")}
              >
                <option value="LOW">Thấp</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Cao</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="dueDate" className="text-sm font-medium">
              Hạn hoàn thành
            </label>
            <input
              id="dueDate"
              type="date"
              className={input}
              {...form.register("dueDate")}
            />
          </div>
        </div>
        {form.formState.errors.root && (
          <p className="mt-3 text-sm text-red-600">
            {form.formState.errors.root.message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
          >
            Hủy
          </button>
          <button
            disabled={form.formState.isSubmitting}
            className="flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {form.formState.isSubmitting && (
              <Loader2 size={16} className="animate-spin" />
            )}
            Lưu
          </button>
        </div>
      </form>
    </div>
  );
}
