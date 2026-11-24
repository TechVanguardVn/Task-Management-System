import { useState } from 'react'
import { projectsApi } from '../../api/projects.js'
import { useProjectMutation } from '../../hooks/useProjectMutation.js'
import { ProjectDialog } from './ProjectDialog.jsx'
import { projectForm, projectPayload, validateProject } from './projectModel.js'

export function ProjectEditor({ project, onClose, onSuccess }) {
  const [values, setValues] = useState(() => projectForm(project))
  const [errors, setErrors] = useState({})
  const mutation = useProjectMutation(onSuccess, project ? 'update' : 'create')
  const combined = { ...mutation.fieldErrors, ...errors }

  function change(event) {
    const { name, value } = event.target
    setValues((previous) => ({ ...previous, [name]: value }))
    setErrors((previous) => ({ ...previous, [name]: undefined }))
  }
  function submit(event) {
    event.preventDefault()
    const validation = validateProject(values)
    for (const name of ['startDate', 'dueDate']) {
      if (event.currentTarget.elements.namedItem(name)?.validity.badInput) {
        validation[name] = 'Vui lòng nhập ngày hợp lệ.'
      }
    }
    setErrors(validation)
    if (Object.keys(validation).length) {
      event.currentTarget.elements
        .namedItem(Object.keys(validation)[0])
        ?.focus()
      return
    }
    const body = projectPayload(values, project)
    void mutation.run((signal) =>
      project
        ? projectsApi.update(project.id, body, signal)
        : projectsApi.create(body, signal),
    )
  }
  function field(name, label, type = 'text', maxLength) {
    return (
      <div className="project-field">
        <label htmlFor={`project-${name}`}>{label}</label>
        <input
          id={`project-${name}`}
          name={name}
          type={type}
          maxLength={maxLength}
          value={values[name]}
          onChange={change}
          aria-invalid={Boolean(combined[name])}
          aria-describedby={
            combined[name] ? `project-${name}-error` : undefined
          }
          required={name === 'name'}
        />
        {combined[name] && (
          <p id={`project-${name}-error`} className="project-field-error">
            {combined[name]}
          </p>
        )}
      </div>
    )
  }
  return (
    <ProjectDialog
      title={project ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
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
          <legend className="sr-only">Thông tin dự án</legend>
          {field('name', 'Tên dự án', 'text', 120)}
          <div className="project-field">
            <label htmlFor="project-description">
              Mô tả <span>(không bắt buộc)</span>
            </label>
            <textarea
              id="project-description"
              name="description"
              maxLength={10000}
              rows={4}
              value={values.description}
              onChange={change}
              aria-invalid={Boolean(combined.description)}
              aria-describedby={
                combined.description ? 'description-error' : undefined
              }
            />
            {combined.description && (
              <p id="description-error" className="project-field-error">
                {combined.description}
              </p>
            )}
          </div>
          {field('color', 'Màu dự án (không bắt buộc)', 'text', 32)}
          <div className="project-color-options" aria-label="Màu gợi ý">
            {['#6366f1', '#10b981', '#0ea5e9', '#a855f7', '#f59e0b'].map(
              (color) => (
                <button
                  type="button"
                  key={color}
                  style={{ background: color }}
                  aria-label={`Chọn màu ${color}`}
                  aria-pressed={values.color === color}
                  onClick={() =>
                    setValues((previous) => ({ ...previous, color }))
                  }
                />
              ),
            )}
          </div>
          <div className="project-date-fields">
            {field('startDate', 'Ngày bắt đầu', 'date')}
            {field('dueDate', 'Hạn hoàn thành', 'date')}
          </div>
          {project && (
            <p className="project-form-note">
              Trạng thái hiện tại:{' '}
              {project.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã lưu trữ'}.
              Thao tác này giữ nguyên trạng thái dự án.
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
              : project
                ? 'Lưu thay đổi'
                : 'Tạo dự án'}
          </button>
        </footer>
      </form>
    </ProjectDialog>
  )
}
