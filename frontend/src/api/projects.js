import { withProjectCache } from '../query/mutations.js'
import { apiClient } from './client.js'
import { createProjectsApi } from './projectRequests.js'

export const projectsApi = withProjectCache(createProjectsApi(apiClient))
