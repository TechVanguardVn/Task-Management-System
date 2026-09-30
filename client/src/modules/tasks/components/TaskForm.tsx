import { useEffect, useState } from 'react';
import type { TaskPayload, TaskPriority, TaskStatus } from '@/modules/tasks/types/taskType';
import type { TaskFormProps } from '@/modules/tasks/types/taskFormType';

const statusOptions: TaskStatus[] = ['TODO', 'IN_PROGRESS', 'DONE'];
const priorityOptions: TaskPriority[] = ['LOW', 'MEDIUM', 'HIGH'];

const statusLabelMap: Record<TaskStatus, string> = {
  TODO: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thực hiện',
  DONE: 'Hoàn thành',
};

const priorityLabelMap: Record<TaskPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
};

const defaultValues: TaskPayload = {
  title: '',
  description: '',
  status: 'TODO',
  priority: 'MEDIUM',
  due_date: '',
};

export const TaskForm: React.FC<TaskFormProps> = ({ initialValues, onSubmit, onCancel, submitting = false }) => {
  const [form, setForm] = useState<TaskPayload>(defaultValues);

  useEffect(() => {
    if (initialValues) {
      setForm({
        title: initialValues.title ?? '',
        description: initialValues.description ?? '',
        status: initialValues.status ?? 'TODO',
        priority: initialValues.priority ?? 'MEDIUM',
        due_date: initialValues.due_date ?? '',
      });
    } else {
      setForm(defaultValues);
    }
  }, [initialValues]);

  const updateField = <K extends keyof TaskPayload>(field: K, value: TaskPayload[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      description: form.description?.trim() || '',
      title: form.title.trim(),
      due_date: form.due_date || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
        <input
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Ví dụ: Hoàn thiện landing page"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
        <textarea
          value={form.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Mô tả chi tiết công việc..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
          <select
            value={form.status}
            onChange={(e) => updateField('status', e.target.value as TaskStatus)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>{statusLabelMap[status]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mức ưu tiên</label>
          <select
            value={form.priority}
            onChange={(e) => updateField('priority', e.target.value as TaskPriority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>{priorityLabelMap[priority]}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hạn hoàn thành</label>
          <input
            type="date"
            value={form.due_date ?? ''}
            onChange={(e) => updateField('due_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || !form.title.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : initialValues ? 'Cập nhật' : 'Thêm công việc'}
        </button>
      </div>
    </form>
  );
};
