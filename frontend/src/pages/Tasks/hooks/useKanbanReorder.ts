import { useCallback } from 'react'
import type { ReorderItem } from '@/pages/Tasks/types/task.types'
import { useReorderTasksMutation } from '@/services/queries/task.query'
import { App } from 'antd'

export function useKanbanReorder() {
  const { message } = App.useApp()
  const { mutateAsync: reorder } = useReorderTasksMutation()

  const onReorder = useCallback(async (
    taskOrders: ReorderItem[],
    rollback: () => void
  ) => {
    try {
      await reorder(taskOrders)
    } catch {
      rollback()
      message.error('Sắp xếp thất bại, đã khôi phục vị trí cũ')
    }
  }, [reorder, message])

  return { onReorder }
}
