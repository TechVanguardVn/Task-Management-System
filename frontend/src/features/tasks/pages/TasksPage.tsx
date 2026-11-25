import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreateTaskRequest, TaskFilterParams, TaskPriority, TaskResponse, TaskStatus, UpdateTaskRequest } from '../../../types/task.types';
import { taskService } from '../../../services/api/taskService';
import { TaskFilterBar } from '../components/TaskFilterBar';
import { TaskListView } from '../components/TaskListView';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { TaskDetailModal } from '../components/TaskDetailModal';

export const TasksPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Đồng bộ trạng thái bộ lọc lên URL Parameters (Quy chuẩn số 14)
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as TaskStatus) || undefined;
  const priority = (searchParams.get('priority') as TaskPriority) || undefined;
  const page = parseInt(searchParams.get('page') || '0', 10);
  const viewMode = (searchParams.get('view') as 'list' | 'kanban') || 'list';

  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Trạng thái modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | null>(null);
  const [selectedDetailTaskId, setSelectedDetailTaskId] = useState<number | null>(null);

  const updateParams = (updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          next.set(key, value);
        } else {
          next.delete(key);
        }
      });
      return next;
    });
  };

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      if (viewMode === 'kanban') {
        const data = await taskService.getKanbanTasks();
        setTasks(data);
      } else {
        const params: TaskFilterParams = {
          search: search || undefined,
          status,
          priority,
          page,
          size: 9,
          sortBy: 'createdAt',
          sortDir: 'desc',
        };
        const data = await taskService.getTasks(params);
        setTasks(data.content);
        setTotalElements(data.totalElements);
        setTotalPages(data.totalPages);
      }
    } catch {
      // Lỗi tải dữ liệu danh sách
    } finally {
      setIsLoading(false);
    }
  }, [search, status, priority, page, viewMode]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Lọc tác vụ trên giao diện Kanban theo từ khóa và bộ lọc trạng thái / ưu tiên
  const displayedKanbanTasks = useMemo(() => {
    if (viewMode !== 'kanban') return tasks;
    return tasks.filter((t) => {
      const s = search.trim().toLowerCase();
      const matchesSearch =
        !s ||
        t.title.toLowerCase().includes(s) ||
        (t.description && t.description.toLowerCase().includes(s));
      const matchesStatus = !status || t.status === status;
      const matchesPriority = !priority || t.priority === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, viewMode, search, status, priority]);

  // Kéo thả Kanban với Optimistic UI Update (Phản hồi tức thì)
  const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
    const previousTasks = [...tasks];
    // 1. Cập nhật state UI ngay lập tức
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );

    try {
      // 2. Gửi API ngầm
      await taskService.updateTaskStatus(taskId, { status: newStatus });
    } catch {
      // 3. Rollback nếu có lỗi mạng
      setTasks(previousTasks);
      alert('Không thể cập nhật trạng thái công việc. Vui lòng kiểm tra kết nối.');
    }
  };

  const handleCreateOrUpdate = async (data: CreateTaskRequest | UpdateTaskRequest) => {
    if (editingTask) {
      await taskService.updateTask(editingTask.id, data as UpdateTaskRequest);
    } else {
      await taskService.createTask(data as CreateTaskRequest);
    }
    fetchTasks();
  };

  const handleDeleteTask = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
      try {
        await taskService.deleteTask(id);
        fetchTasks();
      } catch {
        // Bỏ qua lỗi xóa task
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-zinc-100">Quản lý Công việc</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
            Theo dõi tiến độ, phân loại mức độ ưu tiên và chuyển đổi linh hoạt giữa Danh sách và Kanban
          </p>
        </div>
      </div>

      {/* Thanh bộ lọc và công cụ tìm kiếm */}
      <TaskFilterBar
        search={search}
        onSearchChange={(val) => updateParams({ search: val, page: '0' })}
        status={status}
        onStatusChange={(val) => updateParams({ status: val, page: '0' })}
        priority={priority}
        onPriorityChange={(val) => updateParams({ priority: val, page: '0' })}
        viewMode={viewMode}
        onViewModeChange={(mode) => updateParams({ view: mode })}
      />

      {/* Vùng nội dung theo chế độ xem */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          tasks={displayedKanbanTasks}
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
      ) : (
        <TaskListView
          tasks={tasks}
          totalElements={totalElements}
          totalPages={totalPages}
          currentPage={page}
          pageSize={9}
          onPageChange={(p) => updateParams({ page: p.toString() })}
          onEditTask={(t) => {
            setEditingTask(t);
            setIsTaskModalOpen(true);
          }}
          onDeleteTask={handleDeleteTask}
          onClickTask={(t) => setSelectedDetailTaskId(t.id)}
          isLoading={isLoading}
        />
      )}

      {/* Modal tạo / sửa task */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        initialTask={editingTask}
      />

      {/* Modal xem chi tiết task & checklist */}
      <TaskDetailModal
        taskId={selectedDetailTaskId}
        isOpen={!!selectedDetailTaskId}
        onClose={() => setSelectedDetailTaskId(null)}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
};
