import React, { useState, useEffect } from 'react';
import { TaskDetailResponse, TaskPriority, TaskStatus } from '../../../types/task.types';
import { taskService } from '../../../services/api/taskService';
import { Modal } from '../../../components/common/Modal';
import { Badge } from '../../../components/common/Badge';
import { Button } from '../../../components/common/Button';
import { Calendar, Plus, CheckCircle2, Circle, Trash2, Clock } from 'lucide-react';

interface TaskDetailModalProps {
  taskId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

/**
 * Modal hiển thị chi tiết toàn bộ công việc: nội dung, tương tác checklist subtasks trực tiếp, và timeline nhật ký hoạt động.
 */
export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
}) => {
  const [task, setTask] = useState<TaskDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const fetchDetail = async (id: number) => {
    try {
      setIsLoading(true);
      const data = await taskService.getTaskById(id);
      setTask(data);
    } catch {
      // Bỏ qua lỗi tải chi tiết
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (taskId && isOpen) {
      fetchDetail(taskId);
    } else {
      setTask(null);
    }
  }, [taskId, isOpen]);

  // Toggle subtask
  const handleToggleSubtask = async (subtaskId: number) => {
    if (!task) return;
    try {
      await taskService.toggleSubtask(subtaskId);
      // Tải lại chi tiết để cập nhật % tiến độ và nhật ký
      await fetchDetail(task.id);
      onTaskUpdated();
    } catch {
      // Bỏ qua lỗi toggle
    }
  };

  // Thêm subtask mới
  const handleAddSubtask = async () => {
    if (!task || !newSubtaskTitle.trim()) return;
    try {
      setIsAddingSubtask(true);
      await taskService.addSubtask(task.id, { title: newSubtaskTitle.trim() });
      setNewSubtaskTitle('');
      await fetchDetail(task.id);
      onTaskUpdated();
    } catch {
      // Bỏ qua lỗi thêm subtask
    } finally {
      setIsAddingSubtask(false);
    }
  };

  // Xóa subtask
  const handleDeleteSubtask = async (subtaskId: number) => {
    if (!task) return;
    try {
      await taskService.deleteSubtask(subtaskId);
      await fetchDetail(task.id);
      onTaskUpdated();
    } catch {
      // Bỏ qua lỗi xóa subtask
    }
  };

  if (!isOpen) return null;

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="danger">Ưu tiên cao</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning">Trung bình</Badge>;
      case 'LOW':
        return <Badge variant="default">Thấp</Badge>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <Badge variant="default">Chưa bắt đầu</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">Đang làm</Badge>;
      case 'DONE':
        return <Badge variant="success">Đã hoàn thành</Badge>;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết công việc" maxWidth="xl">
      {isLoading || !task ? (
        <div className="py-12 flex justify-center text-xs text-gray-400">Đang tải chi tiết...</div>
      ) : (
        <div className="space-y-6">
          {/* Header trạng thái */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              {getStatusBadge(task.status)}
              {getPriorityBadge(task.priority)}
            </div>
            {task.dueDate && (
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-400">
                <Calendar className="w-4 h-4" />
                <span>Hạn chót: {new Date(task.dueDate).toLocaleString('vi-VN')}</span>
              </span>
            )}
          </div>

          {/* Tiêu đề & mô tả */}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-zinc-100 mb-2">{task.title}</h2>
            {task.description ? (
              <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {task.description}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">Không có mô tả chi tiết.</p>
            )}
          </div>

          {/* Checklist Subtasks */}
          <div className="bg-gray-50 dark:bg-zinc-800/50 p-4 rounded-xl border border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-gray-900 dark:text-zinc-100">
                  Danh sách đầu việc con ({task.completedSubtaskCount}/{task.subtaskCount})
                </h4>
              </div>
              <span className="text-xs font-bold text-emerald-600">{task.progressPercentage}%</span>
            </div>

            {/* Thanh tiến độ */}
            <div className="w-full bg-gray-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden mb-4">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${task.progressPercentage}%` }}
              />
            </div>

            {/* Danh sách các subtask */}
            <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1">
              {task.subtasks.map((st) => (
                <div
                  key={st.id}
                  className="flex items-center justify-between text-xs p-2.5 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <button
                    onClick={() => handleToggleSubtask(st.id)}
                    className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                  >
                    {st.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-300 dark:text-zinc-600 shrink-0" />
                    )}
                    <span
                      className={`truncate ${
                        st.isCompleted ? 'line-through text-gray-400 dark:text-zinc-500' : 'text-gray-800 dark:text-zinc-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>

                  <button
                    onClick={() => handleDeleteSubtask(st.id)}
                    className="text-gray-400 hover:text-rose-500 p-1 transition-colors"
                    title="Xóa đầu việc con"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Thêm nhanh subtask */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Thêm đầu việc con mới và nhấn Enter..."
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSubtask}
                isLoading={isAddingSubtask}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </Button>
            </div>
          </div>

          {/* Lịch sử hoạt động (Activity Logs Timeline) */}
          <div>
            <h4 className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-zinc-100 mb-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>Nhật ký hoạt động của công việc</span>
            </h4>

            <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1">
              {task.activityLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 dark:text-zinc-200">{log.description}</p>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
