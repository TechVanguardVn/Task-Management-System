import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";

import { normalizeApiError } from "../lib/api-errors";
import type { ApiError } from "../lib/api-errors";
import { listTasks } from "../services/tasks-api";
import type {
  PaginatedTasksResponse,
  Task,
  TaskFilterParams,
  TaskPriority,
  TaskStatus,
} from "../types/task";

export const SEARCH_DEBOUNCE_MS = 300;
export const DEFAULT_TASK_PAGE_SIZE = 10;

interface TaskQuery {
  search: string;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  page: number;
  pageSize: number;
}

export interface UseTasksResult {
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  search: string;
  debouncedSearch: string;
  status: TaskStatus | null;
  priority: TaskPriority | null;
  isLoading: boolean;
  error: ApiError | null;
  refetch: () => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: TaskStatus | null) => void;
  setPriority: (priority: TaskPriority | null) => void;
  clearFilters: () => void;
}

const INITIAL_QUERY: TaskQuery = {
  search: "",
  status: null,
  priority: null,
  page: 1,
  pageSize: DEFAULT_TASK_PAGE_SIZE,
};

function normalizePage(value: number): number {
  return Number.isFinite(value) ? Math.max(1, Math.trunc(value)) : 1;
}

function normalizePageSize(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_TASK_PAGE_SIZE;
  }

  return Math.min(100, Math.max(1, Math.trunc(value)));
}

function buildApiParams(query: TaskQuery): TaskFilterParams {
  const params: TaskFilterParams = {
    page: query.page,
    page_size: query.pageSize,
  };

  if (query.search) {
    params.search = query.search;
  }
  if (query.status) {
    params.status = query.status;
  }
  if (query.priority) {
    params.priority = query.priority;
  }

  return params;
}

function queriesMatch(left: TaskQuery, right: TaskQuery): boolean {
  return (
    left.search === right.search &&
    left.status === right.status &&
    left.priority === right.priority &&
    left.page === right.page &&
    left.pageSize === right.pageSize
  );
}

export function useTasks(): UseTasksResult {
  const [query, setQuery] = useState<TaskQuery>(INITIAL_QUERY);
  const [searchInput, setSearchInput] = useState("");
  const [result, setResult] = useState<PaginatedTasksResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const queryRef = useRef(query);
  const totalPagesRef = useRef(0);
  const requestIdRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  const applyQuery = useCallback((nextQuery: TaskQuery) => {
    if (queriesMatch(queryRef.current, nextQuery)) {
      return;
    }

    queryRef.current = nextQuery;
    setQuery(nextQuery);
    setResult(null);
    setIsLoading(true);
    setError(null);
  }, []);

  const executeRequest = useCallback((params: TaskFilterParams) => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;

    listTasks(params, controller.signal)
      .then((response) => {
        if (requestIdRef.current !== requestId || controller.signal.aborted) {
          return;
        }

        totalPagesRef.current = response.total_pages;
        setResult(response);
        setError(null);
        setIsLoading(false);
      })
      .catch((requestError: unknown) => {
        if (
          requestIdRef.current !== requestId ||
          controller.signal.aborted ||
          axios.isCancel(requestError)
        ) {
          return;
        }

        setError(normalizeApiError(requestError));
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === query.search) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      applyQuery({
        ...queryRef.current,
        search: normalizedSearch,
        page: 1,
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [applyQuery, query.search, searchInput]);

  useEffect(() => {
    executeRequest(buildApiParams(query));

    return () => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
    };
  }, [executeRequest, query]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    executeRequest(buildApiParams(queryRef.current));
  }, [executeRequest]);

  const setPage = useCallback(
    (value: number) => {
      const currentQuery = queryRef.current;
      const requestedPage = normalizePage(value);
      const maximumPage =
        totalPagesRef.current > 0 ? totalPagesRef.current : requestedPage;

      applyQuery({
        ...currentQuery,
        page: Math.min(requestedPage, maximumPage),
      });
    },
    [applyQuery],
  );

  const setPageSize = useCallback(
    (value: number) => {
      applyQuery({
        ...queryRef.current,
        page: 1,
        pageSize: normalizePageSize(value),
      });
    },
    [applyQuery],
  );

  const setStatus = useCallback(
    (status: TaskStatus | null) => {
      applyQuery({
        ...queryRef.current,
        status,
        page: 1,
      });
    },
    [applyQuery],
  );

  const setPriority = useCallback(
    (priority: TaskPriority | null) => {
      applyQuery({
        ...queryRef.current,
        priority,
        page: 1,
      });
    },
    [applyQuery],
  );

  const clearFilters = useCallback(() => {
    setSearchInput("");

    applyQuery({
      ...queryRef.current,
      search: "",
      status: null,
      priority: null,
      page: 1,
    });
  }, [applyQuery]);

  const total = result?.total ?? 0;
  const totalPages = result?.total_pages ?? 0;

  return {
    items: result?.items ?? [],
    total,
    page: query.page,
    pageSize: query.pageSize,
    totalPages,
    search: searchInput,
    debouncedSearch: query.search,
    status: query.status,
    priority: query.priority,
    isLoading,
    error,
    refetch,
    setPage,
    setPageSize,
    setSearch: setSearchInput,
    setStatus,
    setPriority,
    clearFilters,
  };
}
