import { projectFieldErrors } from '../components/projects/projectModel.js'
import { useNotifiedMutation } from './useNotifiedMutation.js'

export function useProjectMutation(onSuccess, action = 'update') {
  return useNotifiedMutation(onSuccess, projectFieldErrors, `project.${action}`)
}
