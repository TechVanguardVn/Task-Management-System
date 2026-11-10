import { useCallback, useEffect, useId, useState } from "react";
import axios from "axios";

import { normalizeApiError } from "../../lib/api-errors";
import type { ApiError } from "../../lib/api-errors";
import { formatDateTime } from "../../lib/date";
import { getTask } from "../../services/tasks-api";
import type { Task, TaskPriority, TaskStatus } from "../../types/task";
import { Badge } from "../ui/Badge";
import type { BadgeTone } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import { TaskDialog } from "./TaskDialog";

const STATUS_PRESENTATION: Record<
  TaskStatus,
  { label: string; tone: BadgeTone }
> = {
  TODO: { label: "Cần làm", tone: "todo" },
  IN_PROGRESS: { label: "Đang làm", tone: "in-progress" },
  DONE: { label: "Hoàn thành", tone: "done" },
};

const PRIORITY_PRESENTATION: Record<
  TaskPriority,
  { label: string; tone: BadgeTone }
> = {
  HIGH: { label: "Cao", tone: "high" },
  MEDIUM: { label: "Trung bình", tone: "medium" },
  LOW: { label: "Thấp", tone: "low" },
};

interface TaskDetailsModalProps {
  taskId: number;
  initialTask?: Task;
  onClose: () => void;
  onEdit: (task: Task) => void;
}

export function TaskDetailsModal({
  taskId,
  initialTask,
  onClose,
  onEdit,
}: TaskDetailsModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const isInitialValid = initialTask != null && initialTask.id === taskId;
  const [task, setTask] = useState<Task | null>(
    isInitialValid ? initialTask : null,
  );
  const [isLoading, setIsLoading] = useState(!isInitialValid);
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [prevTaskId, setPrevTaskId] = useState(taskId);
  if (prevTaskId !== taskId) {
    setPrevTaskId(taskId);
    setReloadKey(0);
    const valid = initialTask != null && initialTask.id === taskId;
    setIsLoading(!valid);
    setError(null);
    setTask(valid ? initialTask : null);
  }

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (reloadKey === 0 && initialTask != null && initialTask.id === taskId) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    getTask(taskId, controller.signal)
      .then((data) => {
        if (cancelled || controller.signal.aborted) {
          return;
        }

        setTask(data);
        setIsLoading(false);
      })
      .catch((requestError: unknown) => {
        if (
          cancelled ||
          controller.signal.aborted ||
          axios.isCancel(requestError)
        ) {
          return;
        }

        setError(normalizeApiError(requestError));
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [taskId, reloadKey, initialTask]);

  const dialogTitle = task?.title ?? "Chi tiết công việc";

  return (
    <TaskDialog
      title={isLoading ? "Chi tiết công việc" : dialogTitle}
      titleId={titleId}
      descriptionId={descriptionId}
      eyebrow="Chi tiết công việc"
      size="lg"
      onClose={onClose}
    >
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Spinner size="md" label="Đang tải chi tiết công việc" className="text-accent" />
          <p className="mt-3 text-sm text-muted">
            Đang tải chi tiết công việc...
          </p>
        </div>
      ) : error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="grid gap-4 py-4"
        >
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
            <p className="font-semibold">Không thể tải thông tin công việc</p>
            <p className="mt-1">
              {error.status === 404
                ? "Công việc không còn tồn tại hoặc đã bị xóa."
                : error.isNetworkError
                  ? "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại."
                  : "Đã xảy ra lỗi khi tải chi tiết công việc. Vui lòng thử lại."}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            {error.status !== 404 ? (
              <Button onClick={handleRetry} data-dialog-initial-focus>
                Thử lại
              </Button>
            ) : null}
          </div>
        </div>
      ) : task ? (
        <div className="grid gap-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Trạng thái:
              </span>
              <Badge tone={STATUS_PRESENTATION[task.status].tone}>
                {STATUS_PRESENTATION[task.status].label}
              </Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Ưu tiên:
              </span>
              <Badge tone={PRIORITY_PRESENTATION[task.priority].tone}>
                {PRIORITY_PRESENTATION[task.priority].label}
              </Badge>
            </div>
          </div>

          <div className="grid gap-2">
            <h3 className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Mô tả
            </h3>
            {task.description ? (
              <p
                id={descriptionId}
                className="whitespace-pre-wrap break-words rounded-xl border border-line bg-surface-subtle p-4 text-sm leading-6 text-ink shadow-xs"
              >
                {task.description}
              </p>
            ) : (
              <p
                id={descriptionId}
                className="rounded-xl border border-dashed border-line bg-surface-subtle/50 p-4 text-sm italic text-muted"
              >
                Chưa có mô tả
              </p>
            )}
          </div>

          <dl className="grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Hạn chót
              </dt>
              <dd className="mt-1 text-xs font-medium leading-5 text-ink">
                {formatDateTime(task.due_date, "vi-VN", "Chưa đặt hạn")}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Ngày tạo
              </dt>
              <dd className="mt-1 text-xs font-medium leading-5 text-ink">
                {formatDateTime(task.created_at, "vi-VN")}
              </dd>
            </div>

            <div>
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Cập nhật
              </dt>
              <dd className="mt-1 text-xs font-medium leading-5 text-ink">
                {formatDateTime(task.updated_at, "vi-VN")}
              </dd>
            </div>
          </dl>

          <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
            <Button variant="secondary" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="primary"
              data-dialog-initial-focus
              onClick={() => onEdit(task)}
            >
              Chỉnh sửa
            </Button>
          </div>
        </div>
      ) : null}
    </TaskDialog>
  );
}
