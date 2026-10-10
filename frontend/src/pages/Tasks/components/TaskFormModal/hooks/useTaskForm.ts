import { useState, useEffect } from 'react'
import type { CreateTaskFormValues } from '../../../schemas/task.form.schema'
import type { Task } from '../../../types/task.types'
import { useTaskForm as useTaskSubmitAction } from '../../../hooks/useTaskActions'

export const useTaskForm = (
  isOpen: boolean,
  onClose: () => void,
  initialData?: Task
) => {
  const [formData, setFormData] = useState<CreateTaskFormValues>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: '',
    tags: [],
    workspaceId: '',
    assigneeId: ''
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const { submit, isPending: isSubmitting } = useTaskSubmitAction(onClose)

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          title: initialData.title,
          description: initialData.description || '',
          status: initialData.status,
          priority: initialData.priority,
          dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString() : '',
          tags: initialData.tags || [],
          workspaceId: initialData.workspaceId || '',
          assigneeId: (typeof initialData.assigneeId === 'object' && initialData.assigneeId !== null)
            ? initialData.assigneeId._id
            : (initialData.assigneeId || '') as string
        })
      } else {
        setFormData({
          title: '',
          description: '',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: '',
          tags: [],
          workspaceId: '',
          assigneeId: ''
        })
      }
      setErrors({})
    }
  }, [isOpen, initialData])

  const updateField = (field: keyof CreateTaskFormValues, value: any) => {
    setFormData((prev: CreateTaskFormValues) => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors((prev: { [key: string]: string }) => ({ ...prev, [field as string]: '' }))
    }
  }

  const validate = () => {
    const newErrors: { [key: string]: string } = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.workspaceId) {
      newErrors.workspaceId = 'Workspace is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const submissionData: any = { ...formData }
    if (!submissionData.assigneeId) {
      submissionData.assigneeId = null
    }

    await submit(submissionData, initialData)
  }

  return {
    formData,
    errors,
    isSubmitting,
    updateField,
    handleSubmit
  }
}
