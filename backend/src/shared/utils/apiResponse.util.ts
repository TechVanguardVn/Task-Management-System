import { Response } from 'express'
import { ApiSuccessResponse, ApiErrorResponse, PaginatedResult } from '@shared/types/api.types'

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): Response<ApiSuccessResponse<T>> => {
  return res.status(statusCode).json({
    success: true,
    data,
    ...(message && { message }),
  })
}

export const sendError = (
  res: Response,
  error: string,
  statusCode = 400
): Response<ApiErrorResponse> => {
  return res.status(statusCode).json({
    success: false,
    error,
    statusCode,
  })
}

export type { PaginatedResult }
