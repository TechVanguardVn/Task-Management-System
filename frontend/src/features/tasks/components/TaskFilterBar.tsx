import React from 'react';
import { Search, LayoutList, Kanban as KanbanIcon } from 'lucide-react';
import { TaskPriority, TaskStatus } from '../../../types/task.types';

interface TaskFilterBarProps {
  search: string;
  onSearchChange: (val: string) => void;
  status?: TaskStatus;
  onStatusChange: (val?: TaskStatus) => void;
  priority?: TaskPriority;
  onPriorityChange: (val?: TaskPriority) => void;
  viewMode: 'list' | 'kanban';
  onViewModeChange: (mode: 'list' | 'kanban') => void;
}

/**
 * Thanh công cụ tìm kiếm, lọc trạng thái, lọc mức độ ưu tiên và chuyển đổi hiển thị List / Kanban.
 */
export const TaskFilterBar: React.FC<TaskFilterBarProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  viewMode,
  onViewModeChange,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-sm mb-6">
      {/* Ô tìm kiếm theo từ khóa */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
        <input
          type="text"
          placeholder="Tìm kiếm công việc theo tiêu đề (/)..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Bộ lọc Dropdowns */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={status || ''}
          onChange={(e) => onStatusChange(e.target.value ? (e.target.value as TaskStatus) : undefined)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="TODO">Chưa bắt đầu</option>
          <option value="IN_PROGRESS">Đang làm</option>
          <option value="DONE">Đã hoàn thành</option>
        </select>

        <select
          value={priority || ''}
          onChange={(e) => onPriorityChange(e.target.value ? (e.target.value as TaskPriority) : undefined)}
          className="px-2.5 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Tất cả độ ưu tiên</option>
          <option value="HIGH">Ưu tiên cao</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="LOW">Thấp</option>
        </select>

        {/* Chuyển đổi chế độ xem Danh sách vs Bảng Kanban */}
        <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-0.5 rounded-lg border border-gray-200 dark:border-zinc-700">
          <button
            onClick={() => onViewModeChange('list')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
            }`}
            title="Xem dạng Danh sách"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Danh sách</span>
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 shadow-sm'
                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
            }`}
            title="Xem dạng Bảng Kanban"
          >
            <KanbanIcon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Kanban</span>
          </button>
        </div>
      </div>
    </div>
  );
};
