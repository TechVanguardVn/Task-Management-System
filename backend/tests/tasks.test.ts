import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, createUser, prisma, resetDb } from './helpers';

type User = Awaited<ReturnType<typeof createUser>>;

beforeEach(resetDb);
afterAll(() => prisma.$disconnect());

async function createTask(u: User, body: Record<string, unknown>) {
  const res = await api().post('/api/tasks').set('Authorization', u.auth).send(body).expect(201);
  return res.body;
}

describe('Task CRUD', () => {
  it('tạo task với giá trị mặc định', async () => {
    const u = await createUser();
    const task = await createTask(u, { title: '  Viết báo cáo  ' });
    expect(task).toMatchObject({
      title: 'Viết báo cáo',
      status: 'TODO',
      priority: 'MEDIUM',
      description: null,
      dueDate: null,
      tags: [],
      completedAt: null,
    });
    expect(task.userId).toBeUndefined();
  });

  it('tạo task đầy đủ trường', async () => {
    const u = await createUser();
    const task = await createTask(u, {
      title: 'Deploy',
      description: 'Lên production',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: '2030-01-15T10:00:00.000Z',
      tags: ['DevOps', 'devops', 'release'],
    });
    expect(task).toMatchObject({ status: 'IN_PROGRESS', priority: 'HIGH', dueDate: '2030-01-15T10:00:00.000Z' });
    expect(task.tags).toEqual(['devops', 'release']);
  });

  it('validate: tiêu đề rỗng, trạng thái/ưu tiên sai, ngày sai', async () => {
    const u = await createUser();
    for (const body of [
      { title: '   ' },
      { title: 'A', status: 'BLOCKED' },
      { title: 'A', priority: 'URGENT' },
      { title: 'A', dueDate: 'not-a-date' },
      { title: 'x'.repeat(201) },
    ]) {
      const res = await api().post('/api/tasks').set('Authorization', u.auth).send(body);
      expect(res.status, JSON.stringify(body)).toBe(400);
    }
  });

  it('xem, sửa, xoá task', async () => {
    const u = await createUser();
    const task = await createTask(u, { title: 'Ban đầu' });

    const got = await api().get(`/api/tasks/${task.id}`).set('Authorization', u.auth).expect(200);
    expect(got.body.title).toBe('Ban đầu');

    const updated = await api()
      .patch(`/api/tasks/${task.id}`)
      .set('Authorization', u.auth)
      .send({ title: 'Đã sửa', priority: 'LOW', dueDate: null })
      .expect(200);
    expect(updated.body).toMatchObject({ title: 'Đã sửa', priority: 'LOW', dueDate: null });

    await api().delete(`/api/tasks/${task.id}`).set('Authorization', u.auth).expect(204);
    await api().get(`/api/tasks/${task.id}`).set('Authorization', u.auth).expect(404);
  });

  it('chuyển sang DONE thì set completedAt, chuyển lại thì xoá', async () => {
    const u = await createUser();
    const task = await createTask(u, { title: 'T' });

    const done = await api().patch(`/api/tasks/${task.id}`).set('Authorization', u.auth).send({ status: 'DONE' }).expect(200);
    expect(done.body.completedAt).toEqual(expect.any(String));

    const reopened = await api().patch(`/api/tasks/${task.id}`).set('Authorization', u.auth).send({ status: 'TODO' }).expect(200);
    expect(reopened.body.completedAt).toBeNull();
  });

  it('PATCH body rỗng hoặc có trường lạ bị từ chối', async () => {
    const u = await createUser();
    const task = await createTask(u, { title: 'T' });
    await api().patch(`/api/tasks/${task.id}`).set('Authorization', u.auth).send({}).expect(400);
    await api().patch(`/api/tasks/${task.id}`).set('Authorization', u.auth).send({ userId: u.user.id }).expect(400);
  });

  it('id không phải UUID trả 400', async () => {
    const u = await createUser();
    await api().get('/api/tasks/123').set('Authorization', u.auth).expect(400);
  });
});

describe('Phân quyền dữ liệu', () => {
  it('người dùng không thể xem / sửa / xoá / di chuyển task của người khác', async () => {
    const alice = await createUser();
    const bob = await createUser();
    const task = await createTask(alice, { title: 'Bí mật của Alice' });

    await api().get(`/api/tasks/${task.id}`).set('Authorization', bob.auth).expect(404);
    await api().patch(`/api/tasks/${task.id}`).set('Authorization', bob.auth).send({ title: 'hacked' }).expect(404);
    await api().patch(`/api/tasks/${task.id}/move`).set('Authorization', bob.auth).send({ status: 'DONE', position: 0 }).expect(404);
    await api().delete(`/api/tasks/${task.id}`).set('Authorization', bob.auth).expect(404);

    const list = await api().get('/api/tasks').set('Authorization', bob.auth).expect(200);
    expect(list.body.meta.total).toBe(0);

    const stillThere = await api().get(`/api/tasks/${task.id}`).set('Authorization', alice.auth).expect(200);
    expect(stillThere.body.title).toBe('Bí mật của Alice');
  });

  it('không có token thì không truy cập được', async () => {
    await api().get('/api/tasks').expect(401);
    await api().post('/api/tasks').send({ title: 'x' }).expect(401);
    await api().get('/api/dashboard').expect(401);
  });
});

describe('Tìm kiếm, lọc, phân trang', () => {
  async function seed(u: User) {
    const rows = [
      { title: 'Thiết kế logo', status: 'TODO', priority: 'HIGH', dueDate: '2030-01-03T00:00:00Z' },
      { title: 'Thiết kế banner', status: 'IN_PROGRESS', priority: 'LOW', dueDate: '2030-01-01T00:00:00Z' },
      { title: 'Viết blog', status: 'DONE', priority: 'MEDIUM' },
      { title: 'Họp team', status: 'TODO', priority: 'LOW', dueDate: '2030-01-02T00:00:00Z' },
      { title: 'THIẾT KẾ landing page', status: 'DONE', priority: 'HIGH' },
    ];
    for (const r of rows) await createTask(u, r);
  }

  it('tìm theo tiêu đề không phân biệt hoa thường', async () => {
    const u = await createUser();
    await seed(u);
    const res = await api().get('/api/tasks').query({ search: 'thiết kế' }).set('Authorization', u.auth).expect(200);
    expect(res.body.meta.total).toBe(3);
  });

  it('lọc theo trạng thái và mức ưu tiên (hỗ trợ nhiều giá trị)', async () => {
    const u = await createUser();
    await seed(u);
    const a = await api().get('/api/tasks').query({ status: 'TODO' }).set('Authorization', u.auth).expect(200);
    expect(a.body.meta.total).toBe(2);

    const b = await api().get('/api/tasks').query({ status: 'TODO,DONE', priority: 'HIGH' }).set('Authorization', u.auth).expect(200);
    expect(b.body.data.map((t: { title: string }) => t.title).sort()).toEqual(['THIẾT KẾ landing page', 'Thiết kế logo']);

    await api().get('/api/tasks').query({ status: 'WRONG' }).set('Authorization', u.auth).expect(400);
  });

  it('phân trang trả meta đúng', async () => {
    const u = await createUser();
    await seed(u);
    const p1 = await api().get('/api/tasks').query({ limit: 2, page: 1 }).set('Authorization', u.auth).expect(200);
    const p3 = await api().get('/api/tasks').query({ limit: 2, page: 3 }).set('Authorization', u.auth).expect(200);
    expect(p1.body.meta).toEqual({ page: 1, limit: 2, total: 5, totalPages: 3 });
    expect(p1.body.data).toHaveLength(2);
    expect(p3.body.data).toHaveLength(1);

    const all = new Set<string>();
    for (const page of [1, 2, 3]) {
      const r = await api().get('/api/tasks').query({ limit: 2, page }).set('Authorization', u.auth);
      r.body.data.forEach((t: { id: string }) => all.add(t.id));
    }
    expect(all.size).toBe(5); // không trùng / sót bản ghi giữa các trang
  });

  it('sắp xếp theo hạn hoàn thành, task không có hạn nằm cuối', async () => {
    const u = await createUser();
    await seed(u);
    const res = await api().get('/api/tasks').query({ sortBy: 'dueDate', order: 'asc' }).set('Authorization', u.auth).expect(200);
    const titles = res.body.data.map((t: { title: string }) => t.title);
    expect(titles.slice(0, 3)).toEqual(['Thiết kế banner', 'Họp team', 'Thiết kế logo']);
    expect(res.body.data.slice(3).every((t: { dueDate: string | null }) => t.dueDate === null)).toBe(true);
  });
});

describe('Kanban', () => {
  it('board nhóm task theo trạng thái theo đúng thứ tự', async () => {
    const u = await createUser();
    const a = await createTask(u, { title: 'A' });
    const b = await createTask(u, { title: 'B' });
    await createTask(u, { title: 'C', status: 'DONE' });

    const res = await api().get('/api/tasks/board').set('Authorization', u.auth).expect(200);
    expect(res.body.TODO.map((t: { id: string }) => t.id)).toEqual([a.id, b.id]);
    expect(res.body.IN_PROGRESS).toEqual([]);
    expect(res.body.DONE).toHaveLength(1);
  });

  it('kéo thả sang cột khác và đánh lại vị trí', async () => {
    const u = await createUser();
    const a = await createTask(u, { title: 'A' });
    const b = await createTask(u, { title: 'B' });
    const c = await createTask(u, { title: 'C' });
    const x = await createTask(u, { title: 'X', status: 'DONE' });

    // chuyển B lên đầu cột DONE
    const moved = await api()
      .patch(`/api/tasks/${b.id}/move`)
      .set('Authorization', u.auth)
      .send({ status: 'DONE', position: 0 })
      .expect(200);
    expect(moved.body).toMatchObject({ status: 'DONE', position: 0 });
    expect(moved.body.completedAt).toEqual(expect.any(String));

    const board = (await api().get('/api/tasks/board').set('Authorization', u.auth)).body;
    expect(board.TODO.map((t: { id: string; position: number }) => [t.id, t.position])).toEqual([
      [a.id, 0],
      [c.id, 1],
    ]);
    expect(board.DONE.map((t: { id: string }) => t.id)).toEqual([b.id, x.id]);

    // sắp xếp lại trong cùng cột: C lên đầu
    await api().patch(`/api/tasks/${c.id}/move`).set('Authorization', u.auth).send({ status: 'TODO', position: 0 }).expect(200);
    const board2 = (await api().get('/api/tasks/board').set('Authorization', u.auth)).body;
    expect(board2.TODO.map((t: { id: string }) => t.id)).toEqual([c.id, a.id]);
  });

  it('move theo afterId (dùng khi board đang lọc)', async () => {
    const u = await createUser();
    const a = await createTask(u, { title: 'A' });
    const b = await createTask(u, { title: 'B' });
    const x = await createTask(u, { title: 'X', status: 'IN_PROGRESS' });
    const y = await createTask(u, { title: 'Y', status: 'IN_PROGRESS' });

    await api().patch(`/api/tasks/${a.id}/move`).set('Authorization', u.auth).send({ status: 'IN_PROGRESS', afterId: x.id }).expect(200);
    await api().patch(`/api/tasks/${b.id}/move`).set('Authorization', u.auth).send({ status: 'IN_PROGRESS', afterId: null }).expect(200);

    const board = (await api().get('/api/tasks/board').set('Authorization', u.auth)).body;
    expect(board.IN_PROGRESS.map((t: { title: string }) => t.title)).toEqual(['B', 'X', 'A', 'Y']);
    expect(board.IN_PROGRESS.map((t: { position: number }) => t.position)).toEqual([0, 1, 2, 3]);
    expect(y).toBeTruthy();

    // afterId ở cột khác -> 400; thiếu cả position lẫn afterId -> 400
    const done = await createTask(u, { title: 'D', status: 'DONE' });
    await api().patch(`/api/tasks/${a.id}/move`).set('Authorization', u.auth).send({ status: 'TODO', afterId: done.id }).expect(400);
    await api().patch(`/api/tasks/${a.id}/move`).set('Authorization', u.auth).send({ status: 'TODO' }).expect(400);
  });
});

describe('Ràng buộc database', () => {
  it('CHECK constraint chặn dữ liệu sai kể cả khi bỏ qua tầng API', async () => {
    const u = await createUser();
    await expect(prisma.task.create({ data: { userId: u.user.id, title: '   ' } })).rejects.toThrow();
    await expect(prisma.task.create({ data: { userId: u.user.id, title: 'x', position: -1 } })).rejects.toThrow();
    await expect(
      prisma.task.create({ data: { userId: u.user.id, title: 'x', status: 'DONE', completedAt: null } }),
    ).rejects.toThrow();
  });

  it('khoá ngoại: xoá user thì xoá luôn task (ON DELETE CASCADE)', async () => {
    const u = await createUser();
    await createTask(u, { title: 'x' });
    await prisma.user.delete({ where: { id: u.user.id } });
    expect(await prisma.task.count()).toBe(0);
  });
});
