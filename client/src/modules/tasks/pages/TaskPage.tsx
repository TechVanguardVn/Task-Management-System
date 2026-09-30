import { TaskBoard } from '@/modules/tasks/components/TaskBoard';
import { TaskDetailModal } from '@/modules/tasks/components/TaskDetailModal';
import { TaskFilterSection } from '@/modules/tasks/components/TaskFilterSection';
import {
  columns,
  priorityLabelMap,
  statusLabelMap,
  useTaskBoardActions,
} from '@/modules/tasks/hooks/useTaskBoard';
import { useTaskData } from '@/modules/tasks/hooks/useTaskData';
import { useTaskFilters } from '@/modules/tasks/hooks/useTaskFilters';
import { useTaskModal } from '@/modules/tasks/hooks/useTaskModal';
import type { Task } from '@/modules/tasks/types/taskType';
import { TaskModal } from '@/modules/tasks/components/TaskModal';
import { useState } from 'react';

export default function TaskPage() {
  const taskData = useTaskData();
  const modal = useTaskModal();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const filters = useTaskFilters(taskData.tasks);
  const boardActions = useTaskBoardActions(taskData, modal, filters);

  const {
    loading,
    submitting,
    error,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    currentPageByStatus,
    totalPagesByStatus,
    paginatedTasksByStatus,
    setCurrentPageByStatus,
    isTaskModalOpen,
    pageSize,
  } = {
    loading: taskData.loading,
    submitting: taskData.submitting,
    error: taskData.error,
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    statusFilter: filters.statusFilter,
    setStatusFilter: filters.setStatusFilter,
    priorityFilter: filters.priorityFilter,
    setPriorityFilter: filters.setPriorityFilter,
    currentPageByStatus: filters.currentPageByStatus,
    totalPagesByStatus: filters.totalPagesByStatus,
    paginatedTasksByStatus: filters.paginatedTasksByStatus,
    setCurrentPageByStatus: filters.setCurrentPageByStatus,
    isTaskModalOpen: modal.isTaskModalOpen,
    pageSize: filters.pageSize,
  };

  const { handleCreateOrUpdate, handleDelete, handleStatusChange, handleDropTask } = boardActions;

  const { filteredTasks, handleEdit, openCreateTaskModal, closeTaskModal, resetPage, editingTask } = {
    filteredTasks: filters.filteredTasks,
    handleEdit: modal.handleEdit,
    openCreateTaskModal: modal.openCreateTaskModal,
    closeTaskModal: modal.closeTaskModal,
    resetPage: filters.resetPage,
    editingTask: modal.editingTask,
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetPage();
  };

  const handleStatusFilterChange = (value: 'ALL' | Task['status']) => {
    setStatusFilter(value);
    resetPage();
  };

  const handlePriorityFilterChange = (value: 'ALL' | Task['priority']) => {
    setPriorityFilter(value);
    resetPage();
  };

  return (
    <>
      <TaskModal
        isOpen={isTaskModalOpen}
        editingTask={editingTask}
        error={error}
        submitting={submitting}
        onClose={closeTaskModal}
        onSubmit={handleCreateOrUpdate}
      />

      <TaskDetailModal isOpen={!!selectedTask} task={selectedTask} onClose={() => setSelectedTask(null)} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200">
          <TaskFilterSection
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            filteredTasksCount={filteredTasks.length}
            onSearchChange={handleSearchChange}
            onStatusChange={handleStatusFilterChange}
            onPriorityChange={handlePriorityFilterChange}
            onOpenCreateModal={openCreateTaskModal}
          />
        </div>

        <div className="p-5 pt-0">
          <TaskBoard
            columns={columns}
            paginatedTasksByStatus={paginatedTasksByStatus}
            loading={loading}
            filteredTasks={filteredTasks}
            currentPageByStatus={currentPageByStatus}
            totalPagesByStatus={totalPagesByStatus}
            pageSize={pageSize}
            onEdit={handleEdit}
            onView={setSelectedTask}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onDropTask={handleDropTask}
            statusLabelMap={statusLabelMap}
            priorityLabelMap={priorityLabelMap}
            setCurrentPageByStatus={setCurrentPageByStatus}
          />
        </div>
      </div>
    </>
  );
}
