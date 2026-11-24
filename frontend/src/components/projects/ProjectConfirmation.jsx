import { projectsApi } from '../../api/projects.js'
import { useProjectMutation } from '../../hooks/useProjectMutation.js'
import { ProjectDialog } from './ProjectDialog.jsx'

export function ProjectConfirmation({ project, action, onClose, onSuccess }) {
  const mutation = useProjectMutation(onSuccess, action)
  const deleting = action === 'delete'
  return (
    <ProjectDialog
      title={deleting ? 'Xóa dự án?' : 'Lưu trữ dự án?'}
      pending={mutation.pending}
      onClose={onClose}
    >
      <p className="project-confirm-name">{project.name}</p>
      <p className="project-confirm-copy">
        {deleting
          ? 'Dự án và toàn bộ công việc trong dự án sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.'
          : 'Dự án vẫn có thể xem được sau khi lưu trữ. Bạn sẽ không thể tạo mới hoặc chỉnh sửa công việc trong dự án đã lưu trữ.'}
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
          className={
            deleting ? 'project-button-danger' : 'project-button-primary'
          }
          disabled={mutation.pending}
          onClick={() =>
            mutation.run((signal) =>
              deleting
                ? projectsApi.remove(project.id, signal)
                : projectsApi.archive(project.id, signal),
            )
          }
        >
          {mutation.pending
            ? 'Đang xử lý…'
            : deleting
              ? 'Xóa vĩnh viễn'
              : 'Lưu trữ dự án'}
        </button>
      </footer>
    </ProjectDialog>
  )
}
