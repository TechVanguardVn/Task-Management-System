import { TaskForm } from '@/modules/tasks/components/TaskForm';
import type { TaskModalProps } from '@/modules/tasks/types/taskModalType';

export const TaskModal = ({
  isOpen,
  editingTask,
  error,
  submitting,
  onClose,
  onSubmit,
}: TaskModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-bold text-gray-800">
            {editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
          >
            Đóng
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <TaskForm initialValues={editingTask} submitting={submitting} onCancel={onClose} onSubmit={onSubmit} />
      </div>
    </div>
  );
};
