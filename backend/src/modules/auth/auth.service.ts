import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../lib/errors';
import { signToken } from '../../middleware/auth';
import type { LoginInput, RegisterInput } from './auth.schemas';

// Hash giả để so sánh khi email không tồn tại -> thời gian phản hồi tương đương,
// tránh lộ thông tin email nào đã đăng ký (timing attack / user enumeration).
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', 10);

async function createSession(userId: string, userAgent?: string) {
  const session = await prisma.session.create({
    data: {
      userId,
      userAgent: userAgent?.slice(0, 255),
      expiresAt: new Date(Date.now() + env.SESSION_TTL_HOURS * 3600 * 1000),
    },
  });
  return { token: signToken(userId, session.id), expiresAt: session.expiresAt };
}

export async function register(input: RegisterInput, userAgent?: string) {
  const existing = await prisma.user.findUnique({ where: { email: input.email }, select: { id: true } });
  if (existing) throw AppError.conflict('Email đã được sử dụng');

  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });
  return { user, ...(await createSession(user.id, userAgent)) };
}

export async function login(input: LoginInput, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    omit: { passwordHash: false },
  });

  const valid = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) throw AppError.unauthorized('Email hoặc mật khẩu không đúng');

  const { passwordHash: _omit, ...safeUser } = user;
  return { user: safeUser, ...(await createSession(user.id, userAgent)) };
}

export async function logout(sessionId: string) {
  await prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.unauthorized();
  return user;
}
