import { withTaskCache } from '../query/mutations.js'
import { apiClient } from './client.js'
import { createTasksApi } from './taskRequests.js'

export const tasksApi = withTaskCache(createTasksApi(apiClient))
