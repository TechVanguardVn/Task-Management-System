import type { Task } from '@/modules/tasks/types/taskType';

type TaskFilterSectionProps = {
  searchTerm: string;
  statusFilter: 'ALL' | Task['status'];
  priorityFilter: 'ALL' | Task['priority'];
  filteredTasksCount: number;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: 'ALL' | Task['status']) => void;
  onPriorityChange: (value: 'ALL' | Task['priority']) => void;
  onOpenCreateModal: () => void;
};

export const TaskFilterSection = ({
  searchTerm,
  statusFilter,
  priorityFilter,
  filteredTasksCount,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
  onOpenCreateModal,
}: TaskFilterSectionProps) => {
  return (
    <section className="bg-white p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-gray-800">Danh sách công việc</h2>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Thêm công việc
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo tiêu đề..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as 'ALL' | Task['status'])}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="TODO">Chưa bắt đầu</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="DONE">Hoàn thành</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value as 'ALL' | Task['priority'])}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tất cả ưu tiên</option>
            <option value="LOW">Thấp</option>
            <option value="MEDIUM">Trung bình</option>
            <option value="HIGH">Cao</option>
          </select>

          <div className="flex items-center justify-end text-sm text-gray-500">{filteredTasksCount} mục</div>
        </div>
      </div>
    </section>
  );
};
