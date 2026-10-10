import axiosInstance from '@/services/axios/axiosInstance'
import type { ApiResponse } from '@/types/api.types'
import type { AuthTokens, User } from '@/pages/Auth/_shared/types/auth.types'

export const loginAPI = async (body: { email: string; password: string }) => {
  const res = await axiosInstance.post<ApiResponse<AuthTokens>>('/auth/login', body)
  return res.data
}

export const registerAPI = async (body: { email: string; password: string; fullName: string }) => {
  const res = await axiosInstance.post<ApiResponse<User>>('/auth/register', body)
  return res.data
}

export const getMeAPI = async () => {
  const res = await axiosInstance.get<ApiResponse<User>>('/auth/me')
  return res.data
}

export const refreshTokenAPI = async (refreshToken: string) => {
  const res = await axiosInstance.post<ApiResponse<AuthTokens>>('/auth/refresh-token', { refreshToken })
  return res.data
}

export const logoutAPI = async (refreshToken: string) => {
  const res = await axiosInstance.post<ApiResponse<null>>('/auth/logout', { refreshToken })
  return res.data
}

export const logoutAllAPI = async () => {
  const res = await axiosInstance.post<ApiResponse<null>>('/auth/logout-all')
  return res.data
}

export const verifyEmailAPI = async (body: { email: string; otp: string }) => {
  const res = await axiosInstance.post<ApiResponse<AuthTokens>>('/auth/verify-email', body)
  return res.data
}

export const resendOtpAPI = async (body: { email: string }) => {
  const res = await axiosInstance.post<ApiResponse<null>>('/auth/resend-otp', body)
  return res.data
}

export const googleLoginAPI = async (body: { code: string }) => {
  const res = await axiosInstance.post<ApiResponse<AuthTokens>>('/auth/google', body)
  return res.data
}
