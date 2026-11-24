import { keys } from '../../query/keys.js'
import { useCallback, useEffect, useRef, useState } from 'react'
import { tasksApi } from '../../api/tasks.js'
import { useApiResource } from '../../hooks/useApiResource.js'
import { Icon } from '../Icon.jsx'
import { TaskEditor } from '../tasks/TaskEditor.jsx'
import { TaskDeleteDialog } from '../tasks/TaskDeleteDialog.jsx'
import { taskError } from '../tasks/taskModel.js'
import {
  formatDueDate,
  priorityLabels,
  statusLabels,
} from '../dashboard/presentation.js'
import { timestamp } from './kanbanModel.js'

export function TaskDrawer({
  taskId,
  projects,
  onClose,
  onChanged,
  onDeleted,
}) {
  const dialog = useRef(null)
  const [mode, setMode] = useState(null)
  const load = useCallback((signal) => tasksApi.get(taskId, signal), [taskId])
  const resource = useApiResource(load, keys.task(taskId))
  const task = resource.data
  const project = projects.find((item) => item.id === task?.projectId)
  const locked = project?.status !== 'ACTIVE'
  useEffect(() => {
    const element = dialog.current
    const previous = document.activeElement
    element.showModal()
    return () => {
      element.close()
      if (previous?.isConnected) previous.focus()
      else document.querySelector('.kanban-board')?.focus()
    }
  }, [])
  return (
    <>
      <dialog
        ref={dialog}
        className="task-drawer"
        aria-labelledby="task-drawer-title"
        onCancel={(event) => {
          event.preventDefault()
          if (!mode) onClose()
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget && !mode) onClose()
        }}
      >
        <div className="task-drawer-content">
          <header className="task-drawer-header">
            <span>Chi tiết công việc</span>
            <button
              className="shell-icon-button"
              aria-label="Đóng chi tiết công việc"
              onClick={onClose}
            >
              <Icon name="close" />
            </button>
          </header>
          <div className="task-drawer-body">
            {resource.status === 'loading' ? (
              <div role="status">
                <h2 id="task-drawer-title">Đang tải chi tiết…</h2>
                <div className="task-skeleton" />
                <div className="task-skeleton" />
              </div>
            ) : resource.status === 'error' ? (
              <div role="alert">
                <h2 id="task-drawer-title">Chưa thể tải công việc</h2>
                <p>{taskError(resource.error)}</p>
                <button
                  className="project-button-secondary"
                  onClick={resource.retry}
                >
                  Thử lại chi tiết
                </button>
              </div>
            ) : !project ? (
              <div role="alert">
                <h2 id="task-drawer-title">Dự án không khả dụng</h2>
                <p>
                  Dự án của công việc không có trong danh sách hiện tại. Hãy
                  đóng chi tiết và tải lại dự án.
                </p>
              </div>
            ) : (
              <>
                <p className="task-drawer-label">Tên công việc</p>
                <h2 id="task-drawer-title">{task.title}</h2>
                <div className="task-drawer-project">
                  <Icon name="projects" />
                  <div>
                    <span>Dự án trực thuộc</span>
                    <strong>{project.name}</strong>
                  </div>
                </div>
                {locked && (
                  <p className="task-archive-notice">
                    Dự án đã lưu trữ. Công việc chỉ có thể xem.
                  </p>
                )}
                <dl className="task-drawer-fields">
                  <div>
                    <dt>Trạng thái</dt>
                    <dd>{statusLabels[task.status]}</dd>
                  </div>
                  <div>
                    <dt>Độ ưu tiên</dt>
                    <dd>{priorityLabels[task.priority]}</dd>
                  </div>
                  <div>
                    <dt>Hạn hoàn thành</dt>
                    <dd>
                      {task.dueDate ? (
                        <time dateTime={task.dueDate}>
                          {formatDueDate(task.dueDate)}
                        </time>
                      ) : (
                        'Chưa đặt hạn'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Thời gian hoàn thành</dt>
                    <dd>
                      {task.completedAt ? (
                        <time dateTime={task.completedAt}>
                          {timestamp(task.completedAt)}
                        </time>
                      ) : (
                        'Chưa hoàn thành'
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Ngày tạo</dt>
                    <dd>{timestamp(task.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Cập nhật gần nhất</dt>
                    <dd>{timestamp(task.updatedAt)}</dd>
                  </div>
                </dl>
                <h3 className="task-drawer-description-title">
                  Mô tả công việc
                </h3>
                <p className="task-drawer-description">
                  {task.description || 'Chưa có mô tả.'}
                </p>
              </>
            )}
          </div>
          {resource.status === 'success' && project && (
            <footer className="task-drawer-actions">
              <button
                className="project-button-danger"
                disabled={locked}
                onClick={() => setMode({ type: 'delete', task })}
              >
                Xóa công việc
              </button>
              <button
                className="project-button-primary"
                disabled={locked}
                onClick={() => setMode({ type: 'edit', task })}
              >
                Chỉnh sửa công việc
              </button>
            </footer>
          )}
        </div>
      </dialog>
      {mode?.type === 'edit' && (
        <TaskEditor
          task={mode.task}
          project={project}
          projects={projects}
          onClose={() => setMode(null)}
          onSuccess={(result) => {
            setMode(null)
            onChanged(result, 'edit')
          }}
        />
      )}
      {mode?.type === 'delete' && (
        <TaskDeleteDialog
          task={mode.task}
          onClose={() => setMode(null)}
          onSuccess={() => {
            setMode(null)
            onDeleted()
          }}
        />
      )}
    </>
  )
}
