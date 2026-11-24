import React, { useState, useEffect, useCallback } from 'react';
import { TaskResponse, TaskStatus } from '../../../types/task.types';
import { taskService } from '../../../services/api/taskService';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';

export const KanbanPage: React.FC = () => {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState<number | null>(null);

  const fetchKanbanTasks = useCallback(async () => {
    try {
      const data = await taskService.getKanbanTasks();
      setTasks(data);
    } catch {
      // Bỏ qua lỗi nạp kanban
    }
  }, []);

  useEffect(() => {
    fetchKanbanTasks();
  }, [fetchKanbanTasks]);

  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const previous = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      await taskService.updateTaskStatus(taskId, { status: newStatus });
    } catch {
      setTasks(previous);
      alert('Không thể đổi trạng thái công việc. Vui lòng thử lại.');
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        await taskService.deleteTask(id);
        fetchKanbanTasks();
      } catch {
        // Bỏ qua lỗi xóa task
      }
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Bảng Kanban Trực Quan</h1>
        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          Kéo thả thẻ công việc giữa các cột để cập nhật trạng thái thời gian thực với phản hồi Optimistic UI
        </p>
      </div>

      <KanbanBoard
        tasks={tasks}
        onStatusChange={handleStatusChange}
        onEditTask={(t) => {
          setEditingTask(t);
          setIsTaskModalOpen(true);
        }}
        onDeleteTask={handleDeleteTask}
        onOpenCreateModal={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        onClickTask={(t) => setSelectedDetailTaskId(t.id)}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={async (data) => {
          if (editingTask) {
            await taskService.updateTask(editingTask.id, data as any);
          } else {
            await taskService.createTask(data as any);
          }
          fetchKanbanTasks();
        }}
        initialTask={editingTask}
      />

      <TaskDetailModal
        taskId={selectedDetailTaskId}
        isOpen={!!selectedDetailTaskId}
        onClose={() => setSelectedDetailTaskId(null)}
        onTaskUpdated={fetchKanbanTasks}
      />
    </div>
  );
};
