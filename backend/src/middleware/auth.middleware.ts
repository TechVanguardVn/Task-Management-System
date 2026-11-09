import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";
import { clearAuthCookies, parseCookies, SESSION_COOKIE_NAME } from "../shared/cookies";
import { deriveCsrfToken, hashSessionToken, verifyCsrfToken } from "../shared/csrf";
import { AppError } from "../shared/errors";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContext {
  user: AuthenticatedUser;
  sessionId: string;
  tokenHash: string;
  csrfToken: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function validateRequestOrigin(req: Request): void {
  if (!MUTATING_METHODS.has(req.method.toUpperCase())) {
    return;
  }

  const originHeader = req.get("origin");
  if (!originHeader) {
    return;
  }

  let originUrl: URL;
  try {
    originUrl = new URL(originHeader);
  } catch {
    throw new AppError(403, "CSRF_ORIGIN_INVALID", "Invalid Origin header.");
  }

  const hostHeader = req.get("host");
  if (hostHeader && originUrl.host === hostHeader) {
    return;
  }

  const configuredOrigin = process.env.FRONTEND_ORIGIN;
  if (configuredOrigin && originUrl.origin === configuredOrigin) {
    return;
  }

  if (
    process.env.NODE_ENV !== "production" &&
    (originUrl.hostname === "localhost" || originUrl.hostname === "127.0.0.1")
  ) {
    return;
  }

  throw new AppError(403, "CSRF_ORIGIN_MISMATCH", "Origin is not allowed for state-changing requests.");
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    validateRequestOrigin(req);

    const cookies = parseCookies(req.headers.cookie);
    const rawSessionToken = cookies[SESSION_COOKIE_NAME];

    if (!rawSessionToken) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    const tokenHash = hashSessionToken(rawSessionToken);
    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    const now = new Date();
    if (!session || session.revokedAt !== null || session.expiresAt <= now) {
      clearAuthCookies(res);
      throw new AppError(401, "UNAUTHORIZED", "Session is invalid or has expired.");
    }

    const csrfToken = deriveCsrfToken(tokenHash);

    if (MUTATING_METHODS.has(req.method.toUpperCase())) {
      const providedCsrfToken = req.get("x-csrf-token");
      if (!verifyCsrfToken(providedCsrfToken, csrfToken)) {
        throw new AppError(403, "CSRF_INVALID", "Invalid or missing CSRF token.");
      }
    }

    req.auth = {
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        createdAt: session.user.createdAt,
        updatedAt: session.user.updatedAt,
      },
      sessionId: session.id,
      tokenHash,
      csrfToken,
    };

    next();
  } catch (error) {
    next(error);
  }
}
