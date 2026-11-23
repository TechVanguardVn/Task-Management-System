import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, createUser, prisma, resetDb } from './helpers';

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

const inDays = (d: number) => new Date(Date.now() + d * 24 * 3600 * 1000).toISOString();

describe('GET /api/dashboard', () => {
  it('trả về thống kê rỗng cho người dùng mới', async () => {
    const u = await createUser();
    const res = await api().get('/api/dashboard').set('Authorization', u.auth).expect(200);
    expect(res.body.stats).toEqual({ total: 0, todo: 0, inProgress: 0, done: 0, overdue: 0, completionRate: 0 });
    expect(res.body.upcoming).toEqual([]);
  });

  it('đếm theo trạng thái, quá hạn và liệt kê task sắp đến hạn', async () => {
    const u = await createUser();
    const other = await createUser();
    const tasks = [
      { title: 'Sắp hạn 1 ngày', dueDate: inDays(1), priority: 'HIGH' },
      { title: 'Sắp hạn 3 ngày', dueDate: inDays(3), status: 'IN_PROGRESS' },
      { title: 'Còn xa', dueDate: inDays(30) },
      { title: 'Quá hạn', dueDate: inDays(-2) },
      { title: 'Đã xong dù sắp hạn', dueDate: inDays(1), status: 'DONE' },
      { title: 'Không có hạn', status: 'DONE' },
    ];
    for (const t of tasks) await api().post('/api/tasks').set('Authorization', u.auth).send(t).expect(201);
    // dữ liệu của người khác không được tính
    await api().post('/api/tasks').set('Authorization', other.auth).send({ title: 'Của người khác', dueDate: inDays(1) });

    const res = await api().get('/api/dashboard').set('Authorization', u.auth).expect(200);
    expect(res.body.stats).toEqual({ total: 6, todo: 3, inProgress: 1, done: 2, overdue: 1, completionRate: 33 });
    expect(res.body.upcoming.map((t: { title: string }) => t.title)).toEqual(['Sắp hạn 1 ngày', 'Sắp hạn 3 ngày']);
    expect(res.body.overdue.map((t: { title: string }) => t.title)).toEqual(['Quá hạn']);
    expect(res.body.openByPriority).toEqual({ LOW: 0, MEDIUM: 3, HIGH: 1 });

    const wider = await api().get('/api/dashboard').query({ days: 31 }).set('Authorization', u.auth).expect(200);
    expect(wider.body.upcoming).toHaveLength(3);
  });
});
