import type { NextFunction, Request, Response } from "express";
import { validateRequestOrigin } from "../../middleware/auth.middleware";
import {
  clearAuthCookies,
  CSRF_COOKIE_NAME,
  parseCookies,
  SESSION_COOKIE_NAME,
  SESSION_DURATION_MS,
  setAuthCookies,
} from "../../shared/cookies";
import { deriveCsrfToken, generateRawToken, hashSessionToken } from "../../shared/csrf";
import { AppError } from "../../shared/errors";
import { loginSchema, registerSchema } from "./auth.schema";
import { loginUser, registerUser, revokeSession } from "./auth.service";

export async function registerHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    validateRequestOrigin(req);
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);

    setAuthCookies(res, result.sessionToken, result.csrfToken, result.expiresAt);
    res.set("Cache-Control", "no-store");
    res.status(201).json({
      user: result.user,
      csrfToken: result.csrfToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    validateRequestOrigin(req);
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);

    setAuthCookies(res, result.sessionToken, result.csrfToken, result.expiresAt);
    res.set("Cache-Control", "no-store");
    res.status(200).json({
      user: result.user,
      csrfToken: result.csrfToken,
    });
  } catch (error) {
    next(error);
  }
}

export async function logoutHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.auth) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    await revokeSession(req.auth.sessionId);
    clearAuthCookies(res);
    res.set("Cache-Control", "no-store");
    res.status(200).json({ status: "ok" });
  } catch (error) {
    next(error);
  }
}

export function meHandler(req: Request, res: Response, next: NextFunction): void {
  try {
    if (!req.auth) {
      throw new AppError(401, "UNAUTHORIZED", "Authentication is required.");
    }

    res.set("Cache-Control", "no-store");
    res.status(200).json({
      user: req.auth.user,
      csrfToken: req.auth.csrfToken,
    });
  } catch (error) {
    next(error);
  }
}

export function csrfHandler(req: Request, res: Response): void {
  const cookies = parseCookies(req.headers.cookie);
  const rawSessionToken = cookies[SESSION_COOKIE_NAME];

  const csrfToken = rawSessionToken
    ? deriveCsrfToken(hashSessionToken(rawSessionToken))
    : (cookies[CSRF_COOKIE_NAME] || generateRawToken());

  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS,
  });

  res.set("Cache-Control", "no-store");
  res.status(200).json({ csrfToken });
}
