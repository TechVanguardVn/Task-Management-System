import { useState, useCallback } from 'react'
import type { Task } from '@/pages/Tasks/types/task.types'

export function useTaskModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined)

  const openCreate = useCallback(() => {
    setEditingTask(undefined)
    setIsOpen(true)
  }, [])

  const openEdit = useCallback((task: Task) => {
    setEditingTask(task)
    setIsOpen(true)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setEditingTask(undefined)
  }, [])

  return { isOpen, editingTask, openCreate, openEdit, close }
}
