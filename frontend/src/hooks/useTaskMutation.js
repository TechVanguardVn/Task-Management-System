import { taskFieldErrors } from '../components/tasks/taskModel.js'
import { useNotifiedMutation } from './useNotifiedMutation.js'

export function useTaskMutation(
  onSuccess,
  action = 'update',
  concurrent = false,
) {
  return useNotifiedMutation(
    onSuccess,
    taskFieldErrors,
    `task.${action}`,
    concurrent,
  )
}
