import React from 'react';
import { Calendar, CheckCircle2, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { TaskPriority, TaskResponse, TaskStatus } from '../../../types/task.types';
import { Badge } from '../../../components/common/Badge';

interface TaskCardProps {
  task: TaskResponse;
  onEdit?: (task: TaskResponse) => void;
  onDelete?: (id: number) => void;
  onDragStart?: (e: React.DragEvent, id: number) => void;
  onClick?: (task: TaskResponse) => void;
}

/**
 * Card hiển thị công việc dùng chung cho cả List View và Kanban Board.
 */
export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onDragStart,
  onClick,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="danger" size="sm">Ưu tiên cao</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm">Trung bình</Badge>;
      case 'LOW':
        return <Badge variant="default" size="sm">Thấp</Badge>;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'TODO':
        return <Badge variant="default" size="sm">Chưa bắt đầu</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info" size="sm">Đang làm</Badge>;
      case 'DONE':
        return <Badge variant="success" size="sm">Đã xong</Badge>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={(e) => onDragStart && onDragStart(e, task.id)}
      onClick={() => onClick && onClick(task)}
      className="group relative bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700 rounded-xl p-4 shadow-sm hover:shadow transition-all cursor-pointer"
    >
      {/* Header card: Status, Priority & Menu */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {getStatusBadge(task.status)}
          {getPriorityBadge(task.priority)}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              />
              <div className="absolute right-0 top-6 z-20 w-36 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg py-1 text-xs">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit(task);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-gray-700 dark:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-700 text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa</span>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete(task.id);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa task</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tiêu đề & mô tả */}
      <h4 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 mb-1 line-clamp-2">
        {task.title}
      </h4>
      {task.description && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 line-clamp-2 mb-3">
          {task.description}
        </p>
      )}

      {/* Tiến độ Subtasks */}
      {task.subtaskCount > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 mb-1">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>{task.completedSubtaskCount}/{task.subtaskCount} việc con</span>
            </span>
            <span className="font-semibold text-gray-700 dark:text-zinc-300">{task.progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${task.progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer card: Ngày hạn chót */}
      {task.dueDate && (
        <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-zinc-800/80 text-[11px]">
          <span
            className={`flex items-center gap-1 font-medium ${
              isOverdue
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-gray-500 dark:text-zinc-400'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>{formatDate(task.dueDate)}</span>
            {isOverdue && <span className="font-bold text-[10px] uppercase ml-1">(Quá hạn)</span>}
          </span>
        </div>
      )}
    </div>
  );
};
