import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, createUser, prisma, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

describe('POST /api/auth/register', () => {
  it('tạo tài khoản, trả token và không lộ mật khẩu', async () => {
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'An', email: 'An@Example.com', password: 'Passw0rd!' })
      .expect(201);

    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toMatchObject({ name: 'An', email: 'an@example.com' });
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('Passw0rd!');
  });

  it('lưu mật khẩu dưới dạng bcrypt hash', async () => {
    await createUser({ email: 'hash@test.dev', password: 'Secret123' });
    const row = await prisma.user.findUnique({ where: { email: 'hash@test.dev' }, omit: { passwordHash: false } });
    expect(row?.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
    expect(row?.passwordHash).not.toContain('Secret123');
  });

  it('từ chối email trùng (không phân biệt hoa thường)', async () => {
    await createUser({ email: 'dup@test.dev' });
    const res = await api()
      .post('/api/auth/register')
      .send({ name: 'X', email: 'DUP@test.dev', password: 'Passw0rd!' })
      .expect(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it.each([
    [{ name: '', email: 'a@b.co', password: 'Passw0rd!' }, 'name'],
    [{ name: 'A', email: 'not-an-email', password: 'Passw0rd!' }, 'email'],
    [{ name: 'A', email: 'a@b.co', password: 'short1' }, 'password'],
    [{ name: 'A', email: 'a@b.co', password: 'onlyletters' }, 'password'],
  ])('validate dữ liệu đầu vào (%#)', async (body, field) => {
    const res = await api().post('/api/auth/register').send(body).expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.map((d: { field: string }) => d.field)).toContain(field);
  });
});

describe('POST /api/auth/login', () => {
  it('đăng nhập đúng thông tin', async () => {
    const u = await createUser();
    const res = await api().post('/api/auth/login').send({ email: u.email, password: u.password }).expect(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.id).toBe(u.user.id);
  });

  it('sai mật khẩu hoặc email không tồn tại trả cùng một lỗi 401', async () => {
    const u = await createUser();
    const wrongPass = await api().post('/api/auth/login').send({ email: u.email, password: 'Wrong1234' }).expect(401);
    const noUser = await api().post('/api/auth/login').send({ email: 'nobody@test.dev', password: 'Wrong1234' }).expect(401);
    expect(wrongPass.body.error.message).toBe(noUser.body.error.message);
  });
});

describe('Phiên đăng nhập', () => {
  it('GET /me cần token hợp lệ', async () => {
    await api().get('/api/auth/me').expect(401);
    await api().get('/api/auth/me').set('Authorization', 'Bearer invalid.token.here').expect(401);

    const u = await createUser();
    const res = await api().get('/api/auth/me').set('Authorization', u.auth).expect(200);
    expect(res.body.user.email).toBe(u.email);
  });

  it('sau khi logout, token cũ không dùng được nữa', async () => {
    const u = await createUser();
    await api().post('/api/auth/logout').set('Authorization', u.auth).expect(204);
    await api().get('/api/auth/me').set('Authorization', u.auth).expect(401);
    await api().get('/api/tasks').set('Authorization', u.auth).expect(401);
  });

  it('logout một phiên không ảnh hưởng phiên khác', async () => {
    const u = await createUser();
    const second = await api().post('/api/auth/login').send({ email: u.email, password: u.password }).expect(200);
    await api().post('/api/auth/logout').set('Authorization', u.auth).expect(204);
    await api().get('/api/auth/me').set('Authorization', `Bearer ${second.body.token}`).expect(200);
  });
});
