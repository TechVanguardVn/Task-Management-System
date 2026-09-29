import { Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createTask, deleteTask, updateTask } from "../api/tasks";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { TaskList, TaskListSkeleton } from "../components/TaskList";
import { TaskModal } from "../components/TaskModal";
import { useToast } from "../components/Toast";
import { useTasks } from "../hooks/useTasks";
import type { Task, TaskInput, TaskPriority, TaskStatus } from "../types";

const choices = {
  status: ["", "TODO", "IN_PROGRESS", "DONE"],
  priority: ["", "LOW", "MEDIUM", "HIGH"],
} as const;
export function Tasks() {
  const [params, setParams] = useSearchParams();
  const { showToast } = useToast();
  const keyword = params.get("keyword") || "";
  const status = (params.get("status") as TaskStatus) || undefined;
  const priority = (params.get("priority") as TaskPriority) || undefined;
  const page = Number(params.get("page") || 0);
  const [draftKeyword, setDraftKeyword] = useState(keyword);
  const [modalTask, setModalTask] = useState<Task | undefined>();
  const [isModalOpen, setModalOpen] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  useEffect(() => {
    setDraftKeyword(keyword);
  }, [keyword]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (draftKeyword !== keyword)
        setParams((current) => {
          const next = new URLSearchParams(current);
          if (draftKeyword) next.set("keyword", draftKeyword);
          else next.delete("keyword");
          next.set("page", "0");
          return next;
        });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draftKeyword, keyword, setParams]);
  const query = useMemo(
    () => ({ keyword: keyword || undefined, status, priority, page, size: 10 }),
    [keyword, status, priority, page],
  );
  const { data, loading, error, reload } = useTasks(query);
  const updateFilters = (key: "status" | "priority", value: string) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(key, value);
      else next.delete(key);
      next.set("page", "0");
      return next;
    });
  const save = async (input: TaskInput) => {
    if (modalTask) await updateTask(modalTask.id, input);
    else await createTask(input);
    setModalOpen(false);
    showToast(modalTask ? "Đã cập nhật công việc." : "Đã tạo công việc.");
    await reload();
  };
  const remove = async () => {
    if (!deleting) return;
    try {
      await deleteTask(deleting.id);
      showToast("Đã xóa công việc.");
      setDeleting(null);
      await reload();
    } catch {
      showToast("Không thể xóa công việc.", "error");
    }
  };
  const setPage = (nextPage: number) =>
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("page", String(nextPage));
      return next;
    });
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Công việc</h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi và cập nhật tiến độ hằng ngày.
          </p>
        </div>
        <button
          onClick={() => {
            setModalTask(undefined);
            setModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
        >
          <Plus size={18} />
          Tạo công việc
        </button>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-200 p-4 md:grid-cols-[1fr_180px_180px]">
          <label className="relative">
            <Search
              className="absolute left-3 top-2.5 text-slate-400"
              size={18}
            />
            <span className="sr-only">Tìm theo tiêu đề</span>
            <input
              value={draftKeyword}
              onChange={(e) => setDraftKeyword(e.target.value)}
              placeholder="Tìm theo tiêu đề..."
              className="w-full rounded-md border border-slate-300 py-2 pl-10 pr-3 text-sm"
            />
          </label>
          <select
            value={status || ""}
            onChange={(e) => updateFilters("status", e.target.value)}
            aria-label="Lọc theo trạng thái"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tất cả trạng thái</option>
            {choices.status.slice(1).map((item) => (
              <option key={item} value={item}>
                {item === "TODO"
                  ? "Cần làm"
                  : item === "IN_PROGRESS"
                    ? "Đang làm"
                    : "Hoàn thành"}
              </option>
            ))}
          </select>
          <select
            value={priority || ""}
            onChange={(e) => updateFilters("priority", e.target.value)}
            aria-label="Lọc theo ưu tiên"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Tất cả ưu tiên</option>
            {choices.priority.slice(1).map((item) => (
              <option key={item} value={item}>
                {item === "LOW"
                  ? "Thấp"
                  : item === "MEDIUM"
                    ? "Trung bình"
                    : "Cao"}
              </option>
            ))}
          </select>
        </div>
        {loading ? (
          <TaskListSkeleton />
        ) : error ? (
          <div className="p-10 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => void reload()}
              className="mt-3 text-sm font-semibold text-teal-700"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <TaskList
            tasks={data?.content || []}
            onEdit={(task) => {
              setModalTask(task);
              setModalOpen(true);
            }}
            onDelete={setDeleting}
          />
        )}
        {data && (
          <div className="flex flex-col gap-3 border-t border-slate-200 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-600">
              Tổng cộng <strong>{data.totalElements}</strong> công việc
            </p>
            <div className="flex items-center gap-3">
              <button
                disabled={data.number === 0}
                onClick={() => setPage(data.number - 1)}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Trước
              </button>
              <span>
                Trang {data.number + 1}/{Math.max(data.totalPages, 1)}
              </span>
              <button
                disabled={data.number + 1 >= data.totalPages}
                onClick={() => setPage(data.number + 1)}
                className="rounded border border-slate-300 px-3 py-1.5 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
      {isModalOpen && (
        <TaskModal
          task={modalTask}
          onClose={() => setModalOpen(false)}
          onSave={save}
        />
      )}
      {deleting && (
        <ConfirmDialog
          title={deleting.title}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove()}
        />
      )}
    </div>
  );
}
