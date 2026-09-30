import { useCallback, useEffect, useState } from 'react';
import { taskApi } from '@/modules/tasks/api/taskApi';
import type { Task, TaskPayload } from '@/modules/tasks/types/taskType';

export const useTaskData = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await taskApi.list();
      setTasks(response.data);
      setError(null);
    } catch {
      setError('Không thể tải danh sách công việc.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const handleCreateOrUpdate = useCallback(
    async (
      payload: TaskPayload,
      editingTask: Task | null,
      onSuccess?: () => void
    ) => {
      try {
        setSubmitting(true);
        setError(null);

        if (editingTask) {
          const response = await taskApi.update(editingTask.id, payload);
          setTasks((prev) => prev.map((task) => (task.id === response.data.id ? response.data : task)));
        } else {
          const response = await taskApi.create(payload);
          setTasks((prev) => [response.data, ...prev]);
        }

        onSuccess?.();
      } catch (err) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Không thể lưu công việc.';
        setError(message);
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  const handleDelete = useCallback(
    async (task: Task, onSuccess?: () => void) => {
      if (!window.confirm(`Bạn có chắc muốn xóa công việc "${task.title}"?`)) return;

      try {
        await taskApi.remove(task.id);
        setTasks((prev) => prev.filter((item) => item.id !== task.id));
        onSuccess?.();
      } catch {
        setError('Không thể xóa công việc này.');
      }
    },
    []
  );

  const handleStatusChange = useCallback(async (task: Task, status: Task['status']) => {
    try {
      const response = await taskApi.updateStatus(task, status);
      setTasks((prev) => prev.map((item) => (item.id === response.data.id ? response.data : item)));
    } catch {
      setError('Không thể cập nhật trạng thái.');
    }
  }, []);

  const handleDropTask = useCallback(async (taskId: number, status: Task['status']) => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;

    try {
      const response = await taskApi.updateStatus(task, status);
      setTasks((prev) => prev.map((item) => (item.id === response.data.id ? response.data : item)));
    } catch {
      setError('Không thể cập nhật trạng thái công việc.');
    }
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    submitting,
    setError,
    fetchTasks,
    handleCreateOrUpdate,
    handleDelete,
    handleStatusChange,
    handleDropTask,
  };
};
