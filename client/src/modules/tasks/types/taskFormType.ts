import type { Task, TaskPayload } from './taskType';

export interface TaskFormProps {
  initialValues?: Partial<Task> | null;
  onSubmit: (payload: TaskPayload) => Promise<void> | void;
  onCancel?: () => void;
  submitting?: boolean;
}
