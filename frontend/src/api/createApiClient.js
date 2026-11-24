import axios from 'axios'
import { clearAccessToken, getAccessToken } from './tokenStore.js'

export function createApiClient(baseURL, { onSessionExpired = () => {} } = {}) {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    withCredentials: false,
    allowAbsoluteUrls: false,
    headers: { Accept: 'application/json' },
  })

  client.interceptors.request.use((config) => {
    // Keep bearer tokens on this API; callers use relative endpoint paths.
    if (
      config.baseURL !== baseURL ||
      /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(config.url || '')
    ) {
      throw new Error(
        'API requests must use relative paths on the configured backend.',
      )
    }

    const token = getAccessToken()
    if (token) config.headers.set('Authorization', `Bearer ${token}`)
    else config.headers.delete('Authorization')
    return config
  })

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      const token = getAccessToken()
      const sentToken = error.config?.headers?.get('Authorization')
      // A late failure from an older session must not clear a newer token.
      if (
        error.response?.status === 401 &&
        token &&
        sentToken === `Bearer ${token}`
      ) {
        onSessionExpired()
        clearAccessToken()
      }
      return Promise.reject(error)
    },
  )

  return client
}
