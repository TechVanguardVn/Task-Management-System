import { Request, Response } from 'express'
import * as authService from '@modules/auth/auth.service'
import { sendSuccess, sendError } from '@shared/utils/apiResponse.util'

export const register = async (req: Request, res: Response) => {
  try {
    const user = await authService.registerUser(req.body)
    sendSuccess(res, user, 'Registration successful', 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Registration failed', 400)
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUser(req.body)
    sendSuccess(res, result, 'Login successful')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Login failed', 401)
  }
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const result = await authService.refreshUserToken(req.body.refreshToken)
    sendSuccess(res, result)
  } catch {
    sendError(res, 'Invalid refresh token', 401)
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    await authService.logoutUser(req.userId!, req.body.refreshToken)
    sendSuccess(res, null, 'Logout successful')
  } catch {
    sendError(res, 'Logout failed', 400)
  }
}

export const logoutAll = async (req: Request, res: Response) => {
  try {
    await authService.logoutAllDevices(req.userId!)
    sendSuccess(res, null, 'Logged out from all devices')
  } catch {
    sendError(res, 'Logout failed', 400)
  }
}

export const me = async (req: Request, res: Response) => {
  try {
    const user = await authService.getMe(req.userId!)
    sendSuccess(res, user)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'User not found', 404)
  }
}

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const result = await authService.verifyEmail(req.body)
    sendSuccess(res, result, 'Email verified successfully')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Email verification failed', 400)
  }
}

export const resendOtp = async (req: Request, res: Response) => {
  try {
    await authService.resendOtp(req.body.email)
    sendSuccess(res, null, 'OTP sent to your email')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to resend OTP', 400)
  }
}

export const googleOAuth = async (req: Request, res: Response) => {
  try {
    const result = await authService.googleLogin(req.body.code)
    sendSuccess(res, result, 'Google login successful')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Google login failed', 400)
  }
}
