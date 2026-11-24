import React from 'react';
import { TaskResponse, TaskStatus } from '../../../../types/task.types';
import { TaskCard } from '../TaskCard';
import { Plus } from 'lucide-react';

interface KanbanBoardProps {
  tasks: TaskResponse[];
  onStatusChange: (taskId: number, newStatus: TaskStatus) => Promise<void>;
  onEditTask: (task: TaskResponse) => void;
  onDeleteTask: (id: number) => void;
  onOpenCreateModal: (defaultStatus?: TaskStatus) => void;
  onClickTask: (task: TaskResponse) => void;
}

/**
 * Bảng Kanban 3 cột trực quan (TODO, IN_PROGRESS, DONE) hỗ trợ kéo thả HTML5 Native mượt mà.
 */
export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onStatusChange,
  onEditTask,
  onDeleteTask,
  onOpenCreateModal,
  onClickTask,
}) => {
  const columns: { status: TaskStatus; title: string; color: string; badgeColor: string }[] = [
    {
      status: 'TODO',
      title: 'Chưa bắt đầu',
      color: 'border-t-amber-500',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
    },
    {
      status: 'IN_PROGRESS',
      title: 'Đang thực hiện',
      color: 'border-t-sky-500',
      badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    },
    {
      status: 'DONE',
      title: 'Đã hoàn thành',
      color: 'border-t-emerald-500',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
  ];

  const handleDragStart = (e: React.DragEvent, id: number) => {
    e.dataTransfer.setData('text/plain', id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskIdStr = e.dataTransfer.getData('text/plain');
    if (!taskIdStr) return;

    const taskId = parseInt(taskIdStr, 10);
    const draggedTask = tasks.find((t) => t.id === taskId);

    if (draggedTask && draggedTask.status !== targetStatus) {
      await onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.status);

        return (
          <div
            key={col.status}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`bg-gray-100/70 dark:bg-zinc-900/50 rounded-xl p-4 border border-gray-200 dark:border-zinc-800 border-t-4 ${col.color} min-h-[500px] flex flex-col`}
          >
            {/* Header cột */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{col.title}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${col.badgeColor}`}>
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => onOpenCreateModal(col.status)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                title={`Thêm công việc vào mục ${col.title}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Danh sách thẻ task trong cột */}
            <div className="space-y-3 flex-1">
              {colTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={onEditTask}
                  onDelete={onDeleteTask}
                  onDragStart={handleDragStart}
                  onClick={onClickTask}
                />
              ))}

              {colTasks.length === 0 && (
                <div className="h-32 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-xs text-gray-400 dark:text-zinc-500">
                  Kéo thả công việc vào đây
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
