import { argon2id, hash, verify } from "argon2";
import { prisma } from "../../db";
import type { AuthenticatedUser } from "../../middleware/auth.middleware";
import { SESSION_DURATION_MS } from "../../shared/cookies";
import { deriveCsrfToken, generateRawToken, hashSessionToken } from "../../shared/csrf";
import { AppError } from "../../shared/errors";
import type { LoginInput, RegisterInput } from "./auth.schema";

export interface AuthSessionResult {
  user: AuthenticatedUser;
  sessionToken: string;
  csrfToken: string;
  expiresAt: Date;
}

function toAuthenticatedUser(user: {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): AuthenticatedUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function registerUser(input: RegisterInput): Promise<AuthSessionResult> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new AppError(409, "EMAIL_ALREADY_EXISTS", "An account with this email already exists.");
  }

  const passwordHash = await hash(input.password, { type: argon2id });
  const sessionToken = generateRawToken();
  const tokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  try {
    const createdUser = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
        sessions: {
          create: {
            tokenHash,
            expiresAt,
          },
        },
      },
    });

    return {
      user: toAuthenticatedUser(createdUser),
      sessionToken,
      csrfToken: deriveCsrfToken(tokenHash),
      expiresAt,
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "An account with this email already exists.");
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthSessionResult> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const isPasswordValid = await verify(user.passwordHash, input.password);
  if (!isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const sessionToken = generateRawToken();
  const tokenHash = hashSessionToken(sessionToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  return {
    user: toAuthenticatedUser(user),
    sessionToken,
    csrfToken: deriveCsrfToken(tokenHash),
    expiresAt,
  };
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.updateMany({
    where: {
      id: sessionId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}
