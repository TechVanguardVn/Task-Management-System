import { apiClient } from './client.js'
import { createDashboardApi } from './dashboardRequests.js'

export const dashboardApi = createDashboardApi(apiClient)
