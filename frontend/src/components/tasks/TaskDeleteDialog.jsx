import { tasksApi } from '../../api/tasks.js'
import { useTaskMutation } from '../../hooks/useTaskMutation.js'
import { ProjectDialog } from '../projects/ProjectDialog.jsx'

export function TaskDeleteDialog({ task, onClose, onSuccess }) {
  const mutation = useTaskMutation(onSuccess, 'delete')
  return (
    <ProjectDialog
      title="Xóa công việc?"
      pending={mutation.pending}
      onClose={onClose}
    >
      <p className="project-confirm-name">{task.title}</p>
      <p className="project-confirm-copy">
        Công việc sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.
      </p>
      {mutation.error && (
        <p className="project-error" role="alert">
          {mutation.error}
        </p>
      )}
      <footer className="project-dialog-actions">
        <button
          type="button"
          className="project-button-secondary"
          onClick={onClose}
          disabled={mutation.pending}
        >
          Hủy
        </button>
        <button
          type="button"
          className="project-button-danger"
          disabled={mutation.pending}
          onClick={() =>
            mutation.run((signal) => tasksApi.remove(task.id, signal))
          }
        >
          {mutation.pending ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
        </button>
      </footer>
    </ProjectDialog>
  )
}
