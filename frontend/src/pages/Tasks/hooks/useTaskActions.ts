import type { CreateTaskFormValues } from '@/pages/Tasks/schemas/task.form.schema'
import type { Task } from '@/pages/Tasks/types/task.types'
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
} from '@/services/queries/task.query'
import { App } from 'antd'
import { useConfirm } from '@/shared/components/ConfirmModal'

export function useTaskForm(onSuccess?: () => void) {
  const { message } = App.useApp()
  const { mutateAsync: createTask, isPending: isCreating } = useCreateTaskMutation()
  const { mutateAsync: updateTask, isPending: isUpdating } = useUpdateTaskMutation()

  const submit = async (values: CreateTaskFormValues, editingTask?: Task) => {
    try {
      if (editingTask) {
        await updateTask({ id: editingTask._id, body: values })
        message.success('Cập nhật thành công')
      } else {
        await createTask(values)
        message.success('Tạo công việc thành công')
      }
      onSuccess?.()
    } catch (error: any) {
      message.error(error.response?.data?.error || error.message || 'Thao tác thất bại')
      throw error // Re-throw to let the caller (Modal) stop the submitting state if needed
    }
  }

  return { submit, isPending: isCreating || isUpdating }
}

export function useTaskDelete() {
  const { message } = App.useApp()
  const confirm = useConfirm()
  const { mutateAsync: deleteTask, isPending } = useDeleteTaskMutation()

  const confirmDelete = (task: Task) => {
    confirm({
      title: 'Xóa công việc?',
      content: `Bạn có chắc muốn xóa "${task.title}"? Hành động này không thể hoàn tác.`,
      okText: 'Xóa',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteTask(task._id)
          message.success('Xóa thành công')
        } catch (error: any) {
          message.error(error.response?.data?.error || error.message || 'Xóa thất bại')
          throw error
        }
      },
    })
  }

  return { confirmDelete, isPending }
}
