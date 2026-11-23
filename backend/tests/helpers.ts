import request from 'supertest';
import { createApp } from '../src/app';
import { prisma } from '../src/lib/prisma';

export const app = createApp();
export const api = () => request(app);

export async function resetDb() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "tasks", "sessions", "users" RESTART IDENTITY CASCADE');
}

let counter = 0;
export async function createUser(overrides: Partial<{ name: string; email: string; password: string }> = {}) {
  counter += 1;
  const body = {
    name: overrides.name ?? `User ${counter}`,
    email: overrides.email ?? `user${counter}_${Date.now()}@test.dev`,
    password: overrides.password ?? 'Passw0rd!',
  };
  const res = await api().post('/api/auth/register').send(body).expect(201);
  return { ...body, token: res.body.token as string, user: res.body.user, auth: `Bearer ${res.body.token}` };
}

export { prisma };
