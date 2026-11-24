import { useState } from 'react'
import { tasksApi } from '../../api/tasks.js'
import { useTaskMutation } from '../../hooks/useTaskMutation.js'
import { ProjectDialog } from '../projects/ProjectDialog.jsx'
import { priorityLabels, statusLabels } from '../dashboard/presentation.js'
import {
  taskForm,
  taskPayload,
  taskPriorities,
  taskStatuses,
  validateTask,
} from './taskModel.js'

export function TaskEditor({
  task,
  project,
  projects,
  onClose,
  onSuccess,
  initialStatus = 'TODO',
}) {
  const [values, setValues] = useState(() => ({
    ...taskForm(task, project?.id === 'all' ? '' : (project?.id ?? '')),
    ...(!task && { status: initialStatus }),
  }))
  const [errors, setErrors] = useState({})
  const mutation = useTaskMutation(onSuccess, task ? 'update' : 'create')
  const combined = { ...mutation.fieldErrors, ...errors }
  const change = (event) => {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }
  function submit(event) {
    event.preventDefault()
    const validation = validateTask(values, projects, task?.projectId)
    if (event.currentTarget.elements.namedItem('dueDate').validity.badInput)
      validation.dueDate = 'Vui lòng nhập ngày hợp lệ.'
    setErrors(validation)
    if (Object.keys(validation).length) {
      event.currentTarget.elements
        .namedItem(Object.keys(validation)[0])
        ?.focus()
      return
    }
    const body = taskPayload(values)
    void mutation.run((signal) =>
      task
        ? tasksApi.update(task.id, body, signal)
        : tasksApi.create(body, signal),
    )
  }
  function field(name, label, control) {
    return (
      <div className="project-field">
        <label htmlFor={`task-${name}`}>{label}</label>
        {control}
        {combined[name] && (
          <p id={`task-${name}-error`} className="project-field-error">
            {combined[name]}
          </p>
        )}
      </div>
    )
  }
  function props(name) {
    return {
      id: `task-${name}`,
      name,
      value: values[name],
      onChange: change,
      'aria-invalid': Boolean(combined[name]),
      'aria-describedby': combined[name] ? `task-${name}-error` : undefined,
    }
  }
  return (
    <ProjectDialog
      title={task ? 'Chỉnh sửa công việc' : 'Thêm công việc'}
      pending={mutation.pending}
      onClose={onClose}
    >
      <form onSubmit={submit} noValidate aria-busy={mutation.pending}>
        {mutation.error && (
          <p className="project-error" role="alert">
            {mutation.error}
          </p>
        )}
        <fieldset disabled={mutation.pending}>
          <legend className="sr-only">Thông tin công việc</legend>
          {field(
            'projectId',
            'Dự án',
            <select {...props('projectId')} required>
              <option value="">Chọn dự án</option>
              {projects.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  disabled={item.status !== 'ACTIVE'}
                >
                  {item.name}
                  {item.status === 'ARCHIVED' ? ' (Đã lưu trữ)' : ''}
                </option>
              ))}
            </select>,
          )}
          {field(
            'title',
            'Tên công việc',
            <input {...props('title')} required maxLength={255} />,
          )}
          {field(
            'description',
            'Mô tả (không bắt buộc)',
            <textarea {...props('description')} maxLength={10000} rows={4} />,
          )}
          <div className="project-date-fields">
            {field(
              'status',
              'Trạng thái',
              <select {...props('status')}>
                {taskStatuses.map((value) => (
                  <option key={value} value={value}>
                    {statusLabels[value]}
                  </option>
                ))}
              </select>,
            )}
            {field(
              'priority',
              'Ưu tiên',
              <select {...props('priority')}>
                {taskPriorities.map((value) => (
                  <option key={value} value={value}>
                    {priorityLabels[value]}
                  </option>
                ))}
              </select>,
            )}
          </div>
          {field(
            'dueDate',
            'Hạn hoàn thành (không bắt buộc)',
            <input {...props('dueDate')} type="date" />,
          )}
          {task && (
            <p className="project-form-note">
              Chuyển dự án chỉ được phép giữa hai dự án đang hoạt động. Thời
              gian hoàn thành do máy chủ quản lý.
            </p>
          )}
        </fieldset>
        <footer className="project-dialog-actions">
          <button
            type="button"
            className="project-button-secondary"
            disabled={mutation.pending}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="project-button-primary"
            disabled={mutation.pending}
          >
            {mutation.pending
              ? 'Đang lưu…'
              : task
                ? 'Lưu thay đổi'
                : 'Thêm công việc'}
          </button>
        </footer>
      </form>
    </ProjectDialog>
  )
}
