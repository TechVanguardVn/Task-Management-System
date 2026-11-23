import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET phải dài ít nhất 32 ký tự'),
  SESSION_TTL_HOURS: z.coerce.number().positive().default(24),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Cấu hình môi trường không hợp lệ:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
  isTest: parsed.data.NODE_ENV === 'test',
  isProd: parsed.data.NODE_ENV === 'production',
};
