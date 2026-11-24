import React from 'react';
import { TaskResponse } from '../../../types/task.types';
import { TaskCard } from './TaskCard';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { Button } from '../../../components/common/Button';

interface TaskListViewProps {
  tasks: TaskResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onEditTask: (task: TaskResponse) => void;
  onDeleteTask: (id: number) => void;
  onClickTask: (task: TaskResponse) => void;
  isLoading?: boolean;
}

/**
 * Hiển thị danh sách công việc dạng Lưới Card kèm phân trang đồng bộ.
 */
export const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  totalElements,
  totalPages,
  currentPage,
  pageSize,
  onPageChange,
  onEditTask,
  onDeleteTask,
  onClickTask,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div
            key={n}
            className="h-44 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 dark:bg-zinc-800 rounded w-1/3 mb-4"></div>
            <div className="h-5 bg-gray-200 dark:bg-zinc-800 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-100 dark:bg-zinc-800 rounded w-full mb-6"></div>
            <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 text-center my-6">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 mb-3">
          <Inbox className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-zinc-100 mb-1">
          Không tìm thấy công việc nào
        </h3>
        <p className="text-xs text-gray-500 dark:text-zinc-400 max-w-sm mb-4">
          Chưa có công việc nào thỏa mãn điều kiện tìm kiếm và bộ lọc của bạn.
        </p>
      </div>
    );
  }

  const startIdx = currentPage * pageSize + 1;
  const endIdx = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div>
      {/* Grid danh sách các card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onClick={onClickTask}
          />
        ))}
      </div>

      {/* Thanh điều hướng phân trang (Pagination) */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm text-xs text-gray-600 dark:text-zinc-400">
          <div>
            Hiển thị <span className="font-semibold text-gray-900 dark:text-zinc-100">{startIdx}</span> -{' '}
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{endIdx}</span> trên tổng số{' '}
            <span className="font-semibold text-gray-900 dark:text-zinc-100">{totalElements}</span> công việc
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 0}
              onClick={() => onPageChange(currentPage - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </Button>

            <span className="px-3 py-1 font-medium text-gray-900 dark:text-zinc-100">
              Trang {currentPage + 1} / {totalPages}
            </span>

            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage >= totalPages - 1}
              onClick={() => onPageChange(currentPage + 1)}
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
