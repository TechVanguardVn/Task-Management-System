import jwt from 'jsonwebtoken'
import { env } from '@shared/config/env.config'

export const signAccessToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as '15m',
  })
}

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as '7d',
  })
}

export const verifyAccessToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { userId: string }
}

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { userId: string }
}
