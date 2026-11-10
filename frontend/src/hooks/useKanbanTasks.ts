import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";

import { normalizeApiError } from "../lib/api-errors";
import type { ApiError } from "../lib/api-errors";
import { listTasks, patchTaskStatus } from "../services/tasks-api";
import type { Task, TaskPriority, TaskStatus } from "../types/task";

export const KANBAN_SEARCH_DEBOUNCE_MS = 300;
export const KANBAN_PAGE_SIZE = 100;
export const KANBAN_MAX_TASKS = 300;
export const KANBAN_MAX_PAGES = Math.ceil(KANBAN_MAX_TASKS / KANBAN_PAGE_SIZE);

interface KanbanQuery {
  search: string;
  priority: TaskPriority | null;
}

const INITIAL_QUERY: KanbanQuery = {
  search: "",
  priority: null,
};

export interface UseKanbanTasksResult {
  tasks: Task[];
  todoTasks: Task[];
  inProgressTasks: Task[];
  doneTasks: Task[];
  totalTasks: number;
  hasExceededCap: boolean;
  isLoading: boolean;
  error: ApiError | null;
  actionError: string | null;
  announcement: string | null;
  updatingTaskIds: Set<number>;
  search: string;
  debouncedSearch: string;
  priority: TaskPriority | null;
  hasActiveFilters: boolean;
  setSearch: (search: string) => void;
  setPriority: (priority: TaskPriority | null) => void;
  clearFilters: () => void;
  refetch: () => void;
  dismissActionError: () => void;
  moveTaskStatus: (taskId: number, targetStatus: TaskStatus) => Promise<void>;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "Cần làm",
  IN_PROGRESS: "Đang thực hiện",
  DONE: "Hoàn thành",
};

export function useKanbanTasks(): UseKanbanTasksResult {
  const [query, setQuery] = useState<KanbanQuery>(INITIAL_QUERY);
  const [searchInput, setSearchInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [hasExceededCap, setHasExceededCap] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState<string | null>(null);
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<number>>(
    () => new Set(),
  );

  const queryRef = useRef(query);
  const tasksRef = useRef(tasks);
  const updatingTaskIdsRef = useRef(updatingTaskIds);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    queryRef.current = query;
    tasksRef.current = tasks;
    updatingTaskIdsRef.current = updatingTaskIds;
  });

  const applyQuery = useCallback((nextQuery: KanbanQuery) => {
    if (
      queryRef.current.search === nextQuery.search &&
      queryRef.current.priority === nextQuery.priority
    ) {
      return;
    }

    queryRef.current = nextQuery;
    setQuery(nextQuery);
    setIsLoading(true);
    setError(null);
  }, []);

  const executeRequest = useCallback((currentQuery: KanbanQuery) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    async function fetchAll() {
      try {
        const firstPage = await listTasks(
          {
            page: 1,
            page_size: KANBAN_PAGE_SIZE,
            search: currentQuery.search || undefined,
            priority: currentQuery.priority || undefined,
          },
          controller.signal,
        );

        if (
          requestIdRef.current !== requestId ||
          controller.signal.aborted
        ) {
          return;
        }

        let combined = [...firstPage.items];
        const total = firstPage.total;
        const totalPages = firstPage.total_pages;

        const maxPagesToFetch = Math.min(totalPages, KANBAN_MAX_PAGES);

        if (maxPagesToFetch > 1) {
          const remainingPageNumbers: number[] = [];
          for (let p = 2; p <= maxPagesToFetch; p++) {
            remainingPageNumbers.push(p);
          }

          const remainingResponses = await Promise.all(
            remainingPageNumbers.map((page) =>
              listTasks(
                {
                  page,
                  page_size: KANBAN_PAGE_SIZE,
                  search: currentQuery.search || undefined,
                  priority: currentQuery.priority || undefined,
                },
                controller.signal,
              ),
            ),
          );

          if (
            requestIdRef.current !== requestId ||
            controller.signal.aborted
          ) {
            return;
          }

          for (const res of remainingResponses) {
            combined = combined.concat(res.items);
          }
        }

        if (combined.length > KANBAN_MAX_TASKS) {
          combined = combined.slice(0, KANBAN_MAX_TASKS);
        }

        setTasks(combined);
        setTotalTasks(total);
        setHasExceededCap(total > KANBAN_MAX_TASKS);
        setError(null);
        setIsLoading(false);
      } catch (err: unknown) {
        if (
          requestIdRef.current !== requestId ||
          controller.signal.aborted ||
          axios.isCancel(err)
        ) {
          return;
        }

        setError(normalizeApiError(err));
        setIsLoading(false);
      }
    }

    void fetchAll();
  }, []);

  // Debounce search input
  useEffect(() => {
    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === query.search) {
      return;
    }

    const timer = setTimeout(() => {
      applyQuery({
        ...queryRef.current,
        search: normalizedSearch,
      });
    }, KANBAN_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [applyQuery, query.search, searchInput]);

  // Execute request when query changes
  useEffect(() => {
    executeRequest(query);

    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [executeRequest, query]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    executeRequest(queryRef.current);
  }, [executeRequest]);

  const setPriority = useCallback(
    (newPriority: TaskPriority | null) => {
      applyQuery({
        ...queryRef.current,
        priority: newPriority,
      });
    },
    [applyQuery],
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");
    applyQuery({
      search: "",
      priority: null,
    });
  }, [applyQuery]);

  const dismissActionError = useCallback(() => {
    setActionError(null);
  }, []);

  const moveTaskStatus = useCallback(
    async (taskId: number, targetStatus: TaskStatus) => {
      if (updatingTaskIdsRef.current.has(taskId)) {
        return;
      }

      const currentTask = tasksRef.current.find((t) => t.id === taskId);
      if (!currentTask || currentTask.status === targetStatus) {
        return;
      }

      const originalStatus = currentTask.status;

      setUpdatingTaskIds((prev) => new Set(prev).add(taskId));
      setActionError(null);

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
      );

      try {
        const serverTask = await patchTaskStatus(taskId, {
          status: targetStatus,
        });

        if (!isMountedRef.current) {
          return;
        }

        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? serverTask : t)),
        );

        setAnnouncement(
          `Đã chuyển công việc "${serverTask.title}" sang trạng thái ${STATUS_LABELS[targetStatus]}.`,
        );
      } catch (err: unknown) {
        if (!isMountedRef.current) {
          return;
        }

        // Roll back ONLY the affected task
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId ? { ...t, status: originalStatus } : t,
          ),
        );

        const apiError = normalizeApiError(err);
        const message = apiError.isNetworkError
          ? "Không thể kết nối tới máy chủ. Kiểm tra kết nối mạng và thử lại."
          : `Không thể cập nhật trạng thái cho công việc "${currentTask.title}". Vui lòng thử lại.`;

        setActionError(message);
        setAnnouncement(
          `Lỗi khi chuyển trạng thái công việc "${currentTask.title}". Đã khôi phục trạng thái ban đầu.`,
        );
      } finally {
        if (isMountedRef.current) {
          setUpdatingTaskIds((prev) => {
            const next = new Set(prev);
            next.delete(taskId);
            return next;
          });
        }
      }
    },
    [],
  );

  const todoTasks = useMemo(
    () => tasks.filter((t) => t.status === "TODO"),
    [tasks],
  );

  const inProgressTasks = useMemo(
    () => tasks.filter((t) => t.status === "IN_PROGRESS"),
    [tasks],
  );

  const doneTasks = useMemo(
    () => tasks.filter((t) => t.status === "DONE"),
    [tasks],
  );

  const hasActiveFilters = Boolean(searchInput.trim() || query.priority);

  return {
    tasks,
    todoTasks,
    inProgressTasks,
    doneTasks,
    totalTasks,
    hasExceededCap,
    isLoading,
    error,
    actionError,
    announcement,
    updatingTaskIds,
    search: searchInput,
    debouncedSearch: query.search,
    priority: query.priority,
    hasActiveFilters,
    setSearch: setSearchInput,
    setPriority,
    clearFilters,
    refetch,
    dismissActionError,
    moveTaskStatus,
  };
}
