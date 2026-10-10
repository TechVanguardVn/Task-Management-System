import { Response, NextFunction, Request } from 'express'
import { verifyAccessToken } from '@shared/utils/jwt.util'
import { sendError } from '@shared/utils/apiResponse.util'

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'Unauthorized', 401)
    return
  }
  const token = authHeader.split(' ')[1]
  try {
    const decoded = verifyAccessToken(token)
    req.userId = decoded.userId
    next()
  } catch {
    sendError(res, 'Token invalid or expired', 401)
  }
}
