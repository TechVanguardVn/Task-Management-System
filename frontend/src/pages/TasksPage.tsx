import { Plus, X } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import axios from "axios";

import { normalizeApiError } from "../lib/api-errors";
import { parseHighlightTaskId } from "../lib/highlight";
import {
  createTask,
  deleteTask,
  getTask,
  patchTaskStatus,
  updateTask,
} from "../services/tasks-api";
import type { Task, TaskStatus, TaskUpdatePayload } from "../types/task";
import { Button } from "../components/ui/Button";
import { ModalLoadingFallback } from "../components/tasks/ModalLoadingFallback";
import { TaskFilterBar } from "../components/tasks/TaskFilterBar";
import { TaskHighlightBanner } from "../components/tasks/TaskHighlightBanner";
import type { HighlightBannerState } from "../components/tasks/TaskHighlightBanner";
import { TaskList } from "../components/tasks/TaskList";
import { TaskPagination } from "../components/tasks/TaskPagination";
import { useTasks } from "../hooks/useTasks";

const TaskDeleteDialog = lazy(() =>
  import("../components/tasks/TaskDeleteDialog").then((m) => ({
    default: m.TaskDeleteDialog,
  })),
);
const TaskDetailsModal = lazy(() =>
  import("../components/tasks/TaskDetailsModal").then((m) => ({
    default: m.TaskDetailsModal,
  })),
);
const TaskFormModal = lazy(() =>
  import("../components/tasks/TaskFormModal").then((m) => ({
    default: m.TaskFormModal,
  })),
);

export function TasksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawHighlightParam = searchParams.get("highlight");
  const highlightId = parseHighlightTaskId(rawHighlightParam);

  const {
    items,
    total,
    page,
    pageSize,
    totalPages,
    search,
    debouncedSearch,
    status,
    priority,
    isLoading,
    error,
    refetch,
    setPage,
    setPageSize,
    setSearch,
    setStatus,
    setPriority,
    clearFilters,
  } = useTasks();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewingTaskId, setViewingTaskId] = useState<number | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingStatusTaskId, setUpdatingStatusTaskId] = useState<
    number | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Step 4 highlight state
  const [expiredHighlightId, setExpiredHighlightId] = useState<number | null>(
    null,
  );
  const [highlightBannerState, setHighlightBannerState] =
    useState<HighlightBannerState | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const timerRef = useRef<number | null>(null);

  const removeHighlightQuery = useCallback(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        next.delete("highlight");
        return next;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  // Clean up invalid highlight queries (e.g. highlight=abc or highlight=-5)
  useEffect(() => {
    if (rawHighlightParam !== null && highlightId === null) {
      removeHighlightQuery();
    }
  }, [rawHighlightParam, highlightId, removeHighlightQuery]);

  // Derived row highlight ID
  const highlightedTaskId =
    !isLoading &&
    !error &&
    highlightId !== null &&
    expiredHighlightId !== highlightId &&
    items.some((item) => item.id === highlightId)
      ? highlightId
      : null;

  // Scenario 1: Task exists in current items -> scroll, highlight for 3s, remove query
  useEffect(() => {
    if (highlightedTaskId === null) {
      return;
    }

    const element = document.getElementById(`task-row-${highlightedTaskId}`);
    if (element) {
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

      element.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    const activeId = highlightedTaskId;
    timerRef.current = window.setTimeout(() => {
      setExpiredHighlightId(activeId);
      removeHighlightQuery();
      timerRef.current = null;
    }, 3000);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [highlightedTaskId, removeHighlightQuery]);

  // Scenario 2: Task NOT in current items -> single GET detail fallback
  useEffect(() => {
    if (isLoading || error || highlightId === null) {
      return;
    }

    const taskInItems = items.some((item) => item.id === highlightId);
    if (taskInItems) {
      return;
    }

    const controller = new AbortController();
    let isCancelled = false;

    getTask(highlightId, controller.signal)
      .then((task) => {
        if (isCancelled || controller.signal.aborted) {
          return;
        }

        setHighlightBannerState({ type: "found", task });
        removeHighlightQuery();
      })
      .catch((requestError: unknown) => {
        if (
          isCancelled ||
          controller.signal.aborted ||
          axios.isCancel(requestError)
        ) {
          return;
        }

        const apiError = normalizeApiError(requestError);

        if (apiError.status === 404) {
          setHighlightBannerState({ type: "not_found" });
          removeHighlightQuery();
        } else {
          const message = apiError.isNetworkError
            ? "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại."
            : "Không thể tải thông tin công việc được liên kết. Vui lòng thử lại.";
          setHighlightBannerState({
            type: "error",
            message,
            isRetrying: false,
          });
        }
      });

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [
    highlightId,
    isLoading,
    error,
    items,
    retryTrigger,
    removeHighlightQuery,
  ]);

  const handleRetryHighlight = useCallback(() => {
    setHighlightBannerState((previous) =>
      previous?.type === "error"
        ? { ...previous, isRetrying: true }
        : previous,
    );
    setRetryTrigger((previous) => previous + 1);
  }, []);

  const handleDismissHighlightBanner = useCallback(() => {
    setHighlightBannerState(null);
    if (rawHighlightParam !== null) {
      removeHighlightQuery();
    }
  }, [rawHighlightParam, removeHighlightQuery]);

  const hasActiveFilters = Boolean(search.trim() || status || priority);
  const hasActiveServerFilters = Boolean(
    debouncedSearch || status || priority,
  );

  const handleCreateTask = async (payload: TaskUpdatePayload) => {
    setIsSubmitting(true);
    try {
      await createTask(payload);
      setIsCreateOpen(false);

      const hasFiltersOrNonFirstPage = Boolean(
        search.trim() || status || priority || page > 1,
      );

      if (hasFiltersOrNonFirstPage) {
        clearFilters();
      } else {
        refetch();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTask = async (payload: TaskUpdatePayload) => {
    if (!editingTask) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask(editingTask.id, payload);
      setEditingTask(null);
      refetch();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTask) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTask(deletingTask.id);
      const isLastItemOnSubsequentPage = page > 1 && items.length === 1;

      setDeletingTask(null);

      if (isLastItemOnSubsequentPage) {
        setPage(page - 1);
      } else {
        refetch();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickStatusChange = useCallback(
    async (task: Task, nextStatus: TaskStatus) => {
      if (updatingStatusTaskId === task.id) {
        return;
      }

      setUpdatingStatusTaskId(task.id);
      setActionError(null);

      try {
        await patchTaskStatus(task.id, { status: nextStatus });
        refetch();
      } catch (err) {
        const apiError = normalizeApiError(err);
        const message = apiError.isNetworkError
          ? "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại."
          : "Không thể cập nhật trạng thái công việc. Vui lòng thử lại.";
        setActionError(message);
        throw err;
      } finally {
        setUpdatingStatusTaskId(null);
      }
    },
    [refetch, updatingStatusTaskId],
  );

  const handleEditFromDetails = useCallback((task: Task) => {
    setViewingTaskId(null);
    setViewingTask(null);
    setEditingTask(task);
  }, []);

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="border-b border-line pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Fieldnote / Công việc
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">
              Quản lý công việc
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Quản lý tiến độ, sắp xếp ưu tiên và theo dõi hạn chót.
            </p>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="self-start sm:self-auto"
          >
            <Plus className="size-4" aria-hidden="true" />
            Tạo công việc
          </Button>
        </div>
      </header>

      {actionError ? (
        <div
          role="alert"
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="Đóng thông báo"
            className="inline-flex size-6 shrink-0 items-center justify-center rounded-lg text-red-700 hover:bg-red-100"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {highlightBannerState ? (
        <div className="mt-6">
          <TaskHighlightBanner
            state={highlightBannerState}
            onOpenDetails={(id) => {
              setViewingTaskId(id);
              if (
                highlightBannerState?.type === "found" &&
                highlightBannerState.task.id === id
              ) {
                setViewingTask(highlightBannerState.task);
              }
            }}
            onRetry={handleRetryHighlight}
            onDismiss={handleDismissHighlightBanner}
          />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        <TaskFilterBar
          search={search}
          status={status}
          priority={priority}
          hasActiveFilters={hasActiveFilters}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onPriorityChange={setPriority}
          onClearFilters={clearFilters}
        />

        <TaskList
          items={items}
          isLoading={isLoading}
          error={error}
          hasActiveFilters={hasActiveServerFilters}
          updatingStatusTaskId={updatingStatusTaskId}
          highlightedTaskId={highlightedTaskId}
          onClearFilters={clearFilters}
          onRetry={refetch}
          onViewDetails={(task) => {
            setViewingTaskId(task.id);
            setViewingTask(task);
          }}
          onEdit={(task) => setEditingTask(task)}
          onDelete={(task) => setDeletingTask(task)}
          onStatusChange={handleQuickStatusChange}
          onCreateTask={() => setIsCreateOpen(true)}
        />

        {!isLoading && !error && total > 0 ? (
          <TaskPagination
            page={page}
            pageSize={pageSize}
            total={total}
            totalPages={totalPages}
            isLoading={isLoading}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </div>

      {isCreateOpen ? (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TaskFormModal
            mode="create"
            isSubmitting={isSubmitting}
            onClose={() => setIsCreateOpen(false)}
            onSubmit={handleCreateTask}
          />
        </Suspense>
      ) : null}

      {editingTask ? (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TaskFormModal
            mode="edit"
            task={editingTask}
            isSubmitting={isSubmitting}
            onClose={() => setEditingTask(null)}
            onSubmit={handleEditTask}
          />
        </Suspense>
      ) : null}

      {viewingTaskId !== null ? (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TaskDetailsModal
            taskId={viewingTaskId}
            initialTask={
              viewingTask?.id === viewingTaskId ? viewingTask : undefined
            }
            onClose={() => {
              setViewingTaskId(null);
              setViewingTask(null);
            }}
            onEdit={handleEditFromDetails}
          />
        </Suspense>
      ) : null}

      {deletingTask ? (
        <Suspense fallback={<ModalLoadingFallback />}>
          <TaskDeleteDialog
            task={deletingTask}
            isDeleting={isDeleting}
            onClose={() => setDeletingTask(null)}
            onConfirm={handleConfirmDelete}
          />
        </Suspense>
      ) : null}
    </div>
  );
}
