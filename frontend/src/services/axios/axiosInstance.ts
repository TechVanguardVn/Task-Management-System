import axios from 'axios'
import env from '@/config/env'
import { store } from '@/store/store'
import { updateTokens, clearAuth } from '@/store/slices/authSlice'

const axiosInstance = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

axiosInstance.interceptors.request.use(config => {
  const token = store.getState().auth.accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error)
    else resolve(token)
  })
  failedQueue = []
}

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return axiosInstance(originalRequest)
        })
        .catch(err => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    const refreshToken = store.getState().auth.refreshToken

    if (!refreshToken) {
      store.dispatch(clearAuth())
      return Promise.reject(error)
    }

    try {
      const response = await axios.post(`${env.API_BASE_URL}/auth/refresh-token`, { refreshToken })
      const { accessToken, refreshToken: newRefreshToken } = response.data.data
      store.dispatch(updateTokens({ accessToken, refreshToken: newRefreshToken }))
      processQueue(null, accessToken)
      originalRequest.headers.Authorization = `Bearer ${accessToken}`
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      store.dispatch(clearAuth())
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default axiosInstance
