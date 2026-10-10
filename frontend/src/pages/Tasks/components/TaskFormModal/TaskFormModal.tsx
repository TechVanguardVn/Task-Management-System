import { Form } from 'antd'
import type { Task } from '../../types/task.types'
import { TaskFormHeader } from './components/TaskFormHeader'
import { TaskFormFooter } from './components/TaskFormFooter'
import { TitleField } from './components/fields/TitleField'
import { DescriptionField } from './components/fields/DescriptionField'
import { StatusSelect } from './components/fields/StatusSelect'
import { PrioritySelect } from './components/fields/PrioritySelect'
import { DueDateField } from './components/fields/DueDateField'
import { TagsField } from './components/fields/TagsField'
import { WorkspaceSelect } from './components/fields/WorkspaceSelect'
import { AssigneeSelect } from './components/fields/AssigneeSelect'
import { useTaskForm } from './hooks/useTaskForm'
import { useGetWorkspaceByIdQuery } from '@/services/queries/workspace.query'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task
}

export const TaskFormModal = ({ isOpen, onClose, task }: TaskFormModalProps) => {
  const { formData, errors, isSubmitting, updateField, handleSubmit } = useTaskForm(isOpen, onClose, task)
  
  const { data: workspaceData } = useGetWorkspaceByIdQuery(formData.workspaceId || '')
  const currentUserRole = workspaceData?.data?.role
  const isAdminOrManager = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN'

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-2xl bg-white/70 backdrop-blur-3xl border border-white/80 rounded-3xl shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18),inset_0_1px_0_0_rgba(255,255,255,0.95)] overflow-hidden transform transition-all duration-300">
        
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-90 pointer-events-none"></div>

        <TaskFormHeader isEditMode={!!task} onClose={onClose} />

        <Form onSubmitCapture={handleSubmit} layout="vertical">
          <div className="p-6 sm:p-8 space-y-6">
            <TitleField 
              value={formData.title} 
              onChange={(val) => updateField('title', val)} 
              error={errors.title} 
            />
            
            <DescriptionField 
              value={formData.description} 
              onChange={(val) => updateField('description', val)} 
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <WorkspaceSelect 
                value={formData.workspaceId} 
                onChange={(val) => updateField('workspaceId', val)} 
                error={errors.workspaceId}
              />
              <AssigneeSelect 
                workspaceId={formData.workspaceId}
                value={formData.assigneeId} 
                onChange={(val) => updateField('assigneeId', val)} 
                error={errors.assigneeId}
                disabled={!isAdminOrManager}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatusSelect 
                value={formData.status} 
                onChange={(val) => updateField('status', val)} 
              />
              <PrioritySelect 
                value={formData.priority} 
                onChange={(val) => updateField('priority', val)} 
              />
              <DueDateField 
                value={formData.dueDate} 
                onChange={(val) => updateField('dueDate', val)} 
              />
              <TagsField 
                tags={formData.tags} 
                onChange={(tags) => updateField('tags', tags)} 
              />
            </div>

            <TaskFormFooter 
              onCancel={onClose} 
              isSubmitting={isSubmitting} 
              isEditMode={!!task} 
            />
          </div>
        </Form>
      </div>
    </div>
  )
}
