import { useState, useEffect } from 'react'
import { z } from 'zod'
import { createWorkspaceSchema } from '../../../schemas/workspace.form.schema'
import type { CreateWorkspaceFormValues } from '../../../schemas/workspace.form.schema'
import { useCreateWorkspaceMutation } from '@/services/queries/workspace.query'

export const useWorkspaceForm = (isOpen: boolean, onClose: () => void) => {
  const { mutateAsync: createWorkspace, isPending } = useCreateWorkspaceMutation()
  const [formData, setFormData] = useState<CreateWorkspaceFormValues>({
    name: '',
    description: ''
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', description: '' })
      setErrors({})
    }
  }, [isOpen])

  const updateField = (field: keyof CreateWorkspaceFormValues, value: any) => {
    setFormData((prev: CreateWorkspaceFormValues) => ({ ...prev, [field]: value }))
    if (errors[field as string]) {
      setErrors((prev: { [key: string]: string }) => ({ ...prev, [field as string]: '' }))
    }
  }

  const validate = () => {
    try {
      createWorkspaceSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {}
        error.issues.forEach((err: any) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message
          }
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      await createWorkspace(formData)
      onClose()
    } catch (error: any) {
      // Assuming error handling logic
      console.error('Failed to create workspace', error)
    }
  }

  return {
    formData,
    errors,
    isSubmitting: isPending,
    updateField,
    handleSubmit
  }
}
