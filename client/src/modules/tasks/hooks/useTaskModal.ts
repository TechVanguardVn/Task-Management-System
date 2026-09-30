import { useState } from 'react';
import type { Task } from '@/modules/tasks/types/taskType';

export const useTaskModal = () => {
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  const openCreateTaskModal = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  return {
    editingTask,
    isTaskModalOpen,
    handleEdit,
    openCreateTaskModal,
    closeTaskModal,
  };
};
