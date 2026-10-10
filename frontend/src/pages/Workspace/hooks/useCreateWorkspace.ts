import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { createWorkspaceSchema, type CreateWorkspaceFormValues } from '../schemas/workspace.schema'

export const useCreateWorkspace = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<CreateWorkspaceFormValues>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: 'Engineering Team',
    },
  })

  const onSubmit = async (values: CreateWorkspaceFormValues) => {
    setIsSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1200))
    console.log('Created workspace:', values)
    setIsSubmitting(false)
  }

  return {
    form,
    onSubmit,
    isSubmitting,
  }
}
