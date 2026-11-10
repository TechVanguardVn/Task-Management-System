import { useId, useRef, useState } from "react";

import { normalizeApiError } from "../../lib/api-errors";
import type { Task } from "../../types/task";
import { Button } from "../ui/Button";
import { TaskDialog } from "./TaskDialog";

interface TaskDeleteDialogProps {
  task: Task;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function TaskDeleteDialog({
  task,
  isDeleting,
  onClose,
  onConfirm,
}: TaskDeleteDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [error, setError] = useState<string | null>(null);
  const deletingRef = useRef(false);

  const isPending = isDeleting;

  async function handleConfirm() {
    if (deletingRef.current || isPending) {
      return;
    }

    deletingRef.current = true;
    setError(null);

    try {
      await onConfirm();
    } catch (err) {
      const apiError = normalizeApiError(err);

      if (apiError.isNetworkError) {
        setError(
          "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại.",
        );
      } else if (apiError.status === 404) {
        setError("Công việc không còn tồn tại hoặc đã bị xóa.");
      } else {
        setError("Không thể xóa công việc. Vui lòng thử lại.");
      }
    } finally {
      deletingRef.current = false;
    }
  }

  return (
    <TaskDialog
      title="Xóa công việc này?"
      titleId={titleId}
      descriptionId={descriptionId}
      eyebrow="Xác nhận"
      size="md"
      onClose={onClose}
      isBusy={isPending}
    >
      <div className="grid gap-4">
        <p id={descriptionId} className="text-sm leading-6 text-muted">
          Hành động này không thể hoàn tác. Công việc{" "}
          <strong className="font-semibold text-ink">"{task.title}"</strong> sẽ
          bị xóa vĩnh viễn khỏi danh sách.
        </p>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm leading-6 text-red-700"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-4">
          <Button
            variant="secondary"
            disabled={isPending}
            onClick={onClose}
            data-dialog-initial-focus
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            isLoading={isPending}
            disabled={isPending}
            onClick={handleConfirm}
          >
            Xóa
          </Button>
        </div>
      </div>
    </TaskDialog>
  );
}
