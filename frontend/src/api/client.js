import { validateApiBaseUrl } from './config.js'
import { createApiClient } from './createApiClient.js'
import { notifySessionExpired } from '../lib/notify.js'

export const apiClient = createApiClient(
  validateApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  { onSessionExpired: notifySessionExpired },
)
