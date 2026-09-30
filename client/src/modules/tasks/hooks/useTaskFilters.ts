import { useMemo, useState } from 'react';
import type { Task } from '@/modules/tasks/types/taskType';

const TASK_STATUS_LIST: Task['status'][] = ['TODO', 'IN_PROGRESS', 'DONE'];
const DEFAULT_PAGE_STATE: Record<Task['status'], number> = {
  TODO: 1,
  IN_PROGRESS: 1,
  DONE: 1,
};

export const useTaskFilters = (tasks: Task[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | Task['status']>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | Task['priority']>('ALL');
  const [currentPages, setCurrentPages] = useState<Record<Task['status'], number>>(DEFAULT_PAGE_STATE);
  const pageSize = 3;

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const titleMatch = query === '' || task.title.toLowerCase().includes(query);
      const statusMatch = statusFilter === 'ALL' || task.status === statusFilter;
      const priorityMatch = priorityFilter === 'ALL' || task.priority === priorityFilter;

      return titleMatch && statusMatch && priorityMatch;
    });
  }, [tasks, searchTerm, statusFilter, priorityFilter]);

  const paginatedTasksByStatus = useMemo(() => {
    const result = {
      TODO: [] as Task[],
      IN_PROGRESS: [] as Task[],
      DONE: [] as Task[],
    };

    TASK_STATUS_LIST.forEach((status) => {
      const statusTasks = filteredTasks.filter((task) => task.status === status);
      const totalPages = Math.max(1, Math.ceil(statusTasks.length / pageSize));
      const safePage = Math.min(currentPages[status] ?? 1, totalPages);
      const start = (safePage - 1) * pageSize;

      result[status] = statusTasks.slice(start, start + pageSize);
    });

    return result;
  }, [filteredTasks, currentPages, pageSize]);

  const totalPagesByStatus = useMemo(() => {
    const result: Record<Task['status'], number> = { TODO: 1, IN_PROGRESS: 1, DONE: 1 };

    TASK_STATUS_LIST.forEach((status) => {
      const statusTasks = filteredTasks.filter((task) => task.status === status);
      result[status] = Math.max(1, Math.ceil(statusTasks.length / pageSize));
    });

    return result;
  }, [filteredTasks, pageSize]);

  const currentPageByStatus = useMemo(() => {
    const result: Record<Task['status'], number> = { TODO: 1, IN_PROGRESS: 1, DONE: 1 };

    TASK_STATUS_LIST.forEach((status) => {
      const totalPages = totalPagesByStatus[status];
      result[status] = Math.min(currentPages[status] ?? 1, totalPages);
    });

    return result;
  }, [currentPages, totalPagesByStatus]);

  const setCurrentPageByStatus = (status: Task['status'], value: number | ((prev: number) => number)) => {
    setCurrentPages((prev) => {
      const nextValue = typeof value === 'function' ? value(prev[status] ?? 1) : value;
      const totalPages = totalPagesByStatus[status];
      const safeValue = Math.min(Math.max(1, nextValue), totalPages);

      return {
        ...prev,
        [status]: safeValue,
      };
    });
  };

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const currentPage = Math.min(currentPages.TODO, totalPages);
  const paginatedTasks = filteredTasks.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const resetPage = () => setCurrentPages(DEFAULT_PAGE_STATE);

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    currentPage,
    setCurrentPage: (value: number | ((prev: number) => number)) => {
      setCurrentPages((prev) => {
        const nextValue = typeof value === 'function' ? value(prev.TODO) : value;
        const safeValue = Math.min(Math.max(1, nextValue), totalPages);

        return {
          TODO: safeValue,
          IN_PROGRESS: prev.IN_PROGRESS,
          DONE: prev.DONE,
        };
      });
    },
    pageSize,
    filteredTasks,
    totalPages,
    paginatedTasks,
    paginatedTasksByStatus,
    totalPagesByStatus,
    currentPageByStatus,
    setCurrentPageByStatus,
    resetPage,
  };
};
