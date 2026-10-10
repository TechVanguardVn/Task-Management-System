import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { ParsedQs } from 'qs'
import { sendError } from '@shared/utils/apiResponse.util'

interface ParsedRequest {
  body?: Record<string, unknown>
  query?: Record<string, unknown>
  params?: Record<string, string>
}

export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    })
    if (!result.success) {
      const message = result.error.issues.map(i => i.message).join(', ')
      sendError(res, message, 422)
      return
    }
    const parsed = result.data as ParsedRequest
    if (parsed.body !== undefined) req.body = parsed.body
    if (parsed.query !== undefined) {
      Object.defineProperty(req, 'query', {
        value: parsed.query,
        writable: true,
        enumerable: true,
        configurable: true
      })
    }
    if (parsed.params !== undefined) req.params = parsed.params as Record<string, string>
    next()
  }
}
