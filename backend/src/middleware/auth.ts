import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/errors';

export interface AuthContext {
  userId: string;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

interface TokenPayload {
  sub: string;
  sid: string;
}

export function signToken(userId: string, sessionId: string) {
  return jwt.sign({ sid: sessionId }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: Math.floor(env.SESSION_TTL_HOURS * 3600),
    algorithm: 'HS256',
  });
}

/**
 * Xác thực Bearer token:
 *  1. Kiểm tra chữ ký + hạn của JWT
 *  2. Kiểm tra session tương ứng còn hiệu lực (chưa logout / chưa hết hạn)
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(AppError.unauthorized());

  let payload: TokenPayload;
  try {
    payload = jwt.verify(header.slice(7), env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  } catch {
    return next(AppError.unauthorized('Token không hợp lệ hoặc đã hết hạn'));
  }

  const session = await prisma.session.findUnique({ where: { id: payload.sid } });
  if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt <= new Date()) {
    return next(AppError.unauthorized('Phiên đăng nhập đã kết thúc, vui lòng đăng nhập lại'));
  }

  req.auth = { userId: session.userId, sessionId: session.id };
  next();
};

/** Lấy auth context trong các route đã qua requireAuth */
export function getAuth(req: Express.Request): AuthContext {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}
