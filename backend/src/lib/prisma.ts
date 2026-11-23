import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * `omit` toàn cục: password_hash không bao giờ được trả về trừ khi truy vấn
 * yêu cầu tường minh (`omit: { passwordHash: false }`), tránh rò rỉ qua API.
 */
export const prisma = new PrismaClient({
  log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  omit: {
    user: { passwordHash: true },
    task: { userId: true },
  },
});
