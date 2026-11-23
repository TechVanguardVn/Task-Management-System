import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env';
import { getAuth, requireAuth } from '../../middleware/auth';
import { loginSchema, registerSchema } from './auth.schemas';
import * as authService from './auth.service';

export const authRouter = Router();

// Chống brute-force: tối đa 20 request / 15 phút / IP cho đăng nhập & đăng ký
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Bạn thao tác quá nhanh, vui lòng thử lại sau' } },
});

authRouter.post('/register', authLimiter, async (req, res) => {
  const input = registerSchema.parse(req.body);
  const result = await authService.register(input, req.get('user-agent'));
  res.status(201).json(result);
});

authRouter.post('/login', authLimiter, async (req, res) => {
  const input = loginSchema.parse(req.body);
  const result = await authService.login(input, req.get('user-agent'));
  res.json(result);
});

authRouter.post('/logout', requireAuth, async (req, res) => {
  await authService.logout(getAuth(req).sessionId);
  res.status(204).end();
});

authRouter.get('/me', requireAuth, async (req, res) => {
  res.json({ user: await authService.me(getAuth(req).userId) });
});
