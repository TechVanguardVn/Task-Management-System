import type { Task } from '@/modules/tasks/types/taskType';

type TaskDetailModalProps = {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void;
};

const priorityStyle: Record<Task['priority'], string> = {
  LOW: 'bg-emerald-100 text-emerald-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HIGH: 'bg-red-100 text-red-700',
};

const statusStyle: Record<Task['status'], string> = {
  TODO: 'bg-sky-100 text-sky-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-emerald-100 text-emerald-700',
};

const statusLabelMap: Record<Task['status'], string> = {
  TODO: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
};

const priorityLabelMap: Record<Task['priority'], string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

export const TaskDetailModal = ({ isOpen, task, onClose }: TaskDetailModalProps) => {
  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-600">Task details</p>
            <h3 className="mt-1 text-2xl font-bold text-slate-800">{task.title}</h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
          >
            Đóng
          </button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[task.status]}`}>
            {statusLabelMap[task.status]}
          </span>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyle[task.priority]}`}>
            {priorityLabelMap[task.priority]}
          </span>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mô tả</p>
            <p>{task.description || 'Không có mô tả chi tiết.'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Hạn chót</p>
              <p className="mt-2 font-medium text-slate-800">{task.due_date || 'Chưa cập nhật'}</p>
            </div>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cập nhật</p>
              <p className="mt-2 font-medium text-slate-800">{task.updated_at || task.created_at || 'Chưa có'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
