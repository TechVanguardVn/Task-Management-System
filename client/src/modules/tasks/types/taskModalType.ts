import type { Task, TaskPayload } from './taskType';

export interface TaskModalProps {
  isOpen: boolean;
  editingTask: Task | null;
  error: string | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: TaskPayload) => Promise<void> | void;
}
