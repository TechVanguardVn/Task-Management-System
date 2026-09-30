import { useMemo, useState } from 'react';
import { useTaskData } from '@/modules/tasks/hooks/useTaskData';
import { useTaskFilters } from '@/modules/tasks/hooks/useTaskFilters';
import { useTaskModal } from '@/modules/tasks/hooks/useTaskModal';
import type { Task, TaskPayload } from '@/modules/tasks/types/taskType';

export const statusLabelMap: Record<Task['status'], string> = {
  TODO: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
};

export const priorityLabelMap: Record<Task['priority'], string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

export const columns: Array<{ key: Task['status']; title: string; color: string }> = [
  { key: 'TODO', title: 'Chưa bắt đầu', color: 'bg-slate-100' },
  { key: 'IN_PROGRESS', title: 'Đang thực hiện', color: 'bg-amber-100' },
  { key: 'DONE', title: 'Hoàn thành', color: 'bg-emerald-100' },
];

export const useTaskSummary = (tasks: Task[]) => {
  const todoCount = useMemo(
    () => tasks.filter((task) => task.status === 'TODO').length,
    [tasks]
  );

  const inProgressCount = useMemo(
    () => tasks.filter((task) => task.status === 'IN_PROGRESS').length,
    [tasks]
  );

  const completedCount = useMemo(
    () => tasks.filter((task) => task.status === 'DONE').length,
    [tasks]
  );

  return { todoCount, inProgressCount, completedCount };
};

export const useTaskDeadlineState = (tasks: Task[]) => {
  const isOverdue = (task: Task) => {
    if (!task.due_date || task.status === 'DONE') return false;

    const dueDate = new Date(task.due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  };

  const [upcomingPage, setUpcomingPage] = useState(1);
  const [overduePage, setOverduePage] = useState(1);
  const deadlinePageSize = 2;

  const upcomingTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => task.due_date && !isOverdue(task))
      .sort(
        (a, b) =>
          new Date(a.due_date as string).getTime() - new Date(b.due_date as string).getTime()
      );
  }, [tasks]);

  const overdueTasks = useMemo(() => {
    return [...tasks]
      .filter((task) => isOverdue(task))
      .sort(
        (a, b) =>
          new Date(b.due_date as string).getTime() - new Date(a.due_date as string).getTime()
      );
  }, [tasks]);

  const upcomingTotalPages = Math.max(1, Math.ceil(upcomingTasks.length / deadlinePageSize));
  const overdueTotalPages = Math.max(1, Math.ceil(overdueTasks.length / deadlinePageSize));

  const paginatedUpcomingTasks = useMemo(() => {
    const start = (upcomingPage - 1) * deadlinePageSize;
    return upcomingTasks.slice(start, start + deadlinePageSize);
  }, [upcomingTasks, upcomingPage]);

  const paginatedOverdueTasks = useMemo(() => {
    const start = (overduePage - 1) * deadlinePageSize;
    return overdueTasks.slice(start, start + deadlinePageSize);
  }, [overdueTasks, overduePage]);

  return {
    upcomingTasks,
    overdueTasks,
    upcomingPage,
    overduePage,
    upcomingTotalPages,
    overdueTotalPages,
    paginatedUpcomingTasks,
    paginatedOverdueTasks,
    setUpcomingPage,
    setOverduePage,
  };
};

export const useTaskBoardActions = (
  taskData: ReturnType<typeof useTaskData>,
  modal: ReturnType<typeof useTaskModal>,
  filters: ReturnType<typeof useTaskFilters>
) => {
  const handleCreateOrUpdate = async (payload: TaskPayload) => {
    await taskData.handleCreateOrUpdate(payload, modal.editingTask, () => {
      modal.closeTaskModal();
      filters.resetPage();
    });
  };

  const handleDelete = async (task: Task) => {
    await taskData.handleDelete(task, () => {
      if (modal.editingTask?.id === task.id) {
        modal.closeTaskModal();
      }
      filters.resetPage();
    });
  };

  const handleStatusChange = async (task: Task, status: Task['status']) => {
    await taskData.handleStatusChange(task, status);
  };

  const handleDropTask = async (taskId: number, status: Task['status']) => {
    await taskData.handleDropTask(taskId, status);
  };

  return {
    handleCreateOrUpdate,
    handleDelete,
    handleStatusChange,
    handleDropTask,
  };
};

export const useTaskBoard = () => {
  const taskData = useTaskData();
  const modal = useTaskModal();
  const filters = useTaskFilters(taskData.tasks);
  const summary = useTaskSummary(taskData.tasks);
  const deadline = useTaskDeadlineState(taskData.tasks);
  const actions = useTaskBoardActions(taskData, modal, filters);

  return {
    tasks: taskData.tasks,
    loading: taskData.loading,
    submitting: taskData.submitting,
    error: taskData.error,
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    statusFilter: filters.statusFilter,
    setStatusFilter: filters.setStatusFilter,
    priorityFilter: filters.priorityFilter,
    setPriorityFilter: filters.setPriorityFilter,
    currentPage: filters.currentPage,
    setCurrentPage: filters.setCurrentPage,
    currentPageByStatus: filters.currentPageByStatus,
    totalPagesByStatus: filters.totalPagesByStatus,
    paginatedTasksByStatus: filters.paginatedTasksByStatus,
    setCurrentPageByStatus: filters.setCurrentPageByStatus,
    isTaskModalOpen: modal.isTaskModalOpen,
    pageSize: filters.pageSize,
    ...summary,
    ...deadline,
    filteredTasks: filters.filteredTasks,
    totalPages: filters.totalPages,
    paginatedTasks: filters.paginatedTasks,
    columns,
    fetchTasks: taskData.fetchTasks,
    handleEdit: modal.handleEdit,
    openCreateTaskModal: modal.openCreateTaskModal,
    closeTaskModal: modal.closeTaskModal,
    resetPage: filters.resetPage,
    statusLabelMap,
    priorityLabelMap,
    editingTask: modal.editingTask,
    ...actions,
  };
};
