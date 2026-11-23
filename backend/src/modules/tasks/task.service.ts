import { Prisma, TaskStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../lib/errors';
import type { BoardQuery, CreateTaskInput, ListTasksQuery, MoveTaskInput, UpdateTaskInput } from './task.schemas';

type Tx = Prisma.TransactionClient;

/** completedAt luôn đồng bộ với status (khớp CHECK constraint trong DB) */
function completedAtFor(status: TaskStatus, previous?: Date | null) {
  if (status !== TaskStatus.DONE) return null;
  return previous ?? new Date();
}

async function nextPosition(tx: Tx, userId: string, status: TaskStatus) {
  const agg = await tx.task.aggregate({ where: { userId, status }, _max: { position: true } });
  return agg._max.position === null ? 0 : agg._max.position + 1;
}

/**
 * Lấy task theo id VÀ userId. Task của người khác trả về 404 (không phải 403)
 * để không tiết lộ sự tồn tại của tài nguyên.
 */
async function findOwned(tx: Tx, userId: string, id: string) {
  const task = await tx.task.findFirst({ where: { id, userId } });
  if (!task) throw AppError.notFound('Không tìm thấy công việc');
  return task;
}

function buildWhere(userId: string, q: { search?: string; status?: TaskStatus[]; priority?: ListTasksQuery['priority'] }) {
  const where: Prisma.TaskWhereInput = { userId };
  if (q.search) where.title = { contains: q.search, mode: 'insensitive' };
  if (q.status?.length) where.status = { in: q.status };
  if (q.priority?.length) where.priority = { in: q.priority };
  return where;
}

export async function listTasks(userId: string, q: ListTasksQuery) {
  const where = buildWhere(userId, q);

  const orderBy: Prisma.TaskOrderByWithRelationInput[] =
    q.sortBy === 'dueDate'
      ? [{ dueDate: { sort: q.order, nulls: 'last' } }]
      : [{ [q.sortBy]: q.order }];
  orderBy.push({ id: 'asc' }); // thứ tự ổn định khi phân trang

  const [total, data] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({ where, orderBy, skip: (q.page - 1) * q.limit, take: q.limit }),
  ]);

  return {
    data,
    meta: { page: q.page, limit: q.limit, total, totalPages: Math.max(1, Math.ceil(total / q.limit)) },
  };
}

export async function getBoard(userId: string, q: BoardQuery) {
  const tasks = await prisma.task.findMany({
    where: buildWhere(userId, q),
    orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    take: 1000,
  });
  const board: Record<TaskStatus, typeof tasks> = { TODO: [], IN_PROGRESS: [], DONE: [] };
  for (const t of tasks) board[t.status].push(t);
  return board;
}

export async function getTask(userId: string, id: string) {
  return findOwned(prisma, userId, id);
}

export async function createTask(userId: string, input: CreateTaskInput) {
  return prisma.$transaction(async (tx) => {
    const position = await nextPosition(tx, userId, input.status);
    return tx.task.create({
      data: {
        userId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
        tags: input.tags,
        position,
        completedAt: completedAtFor(input.status),
      },
    });
  });
}

export async function updateTask(userId: string, id: string, input: UpdateTaskInput) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, userId, id);
    const data: Prisma.TaskUpdateInput = { ...input };

    if (input.status && input.status !== current.status) {
      // Đổi trạng thái qua form -> đưa xuống cuối cột mới
      data.position = await nextPosition(tx, userId, input.status);
      data.completedAt = completedAtFor(input.status, current.completedAt);
    }
    return tx.task.update({ where: { id: current.id }, data });
  });
}

/**
 * Kéo thả Kanban: đặt task vào cột `status` tại vị trí `position`,
 * đánh lại số thứ tự liên tục (0..n) cho cột đích và cột nguồn.
 */
export async function moveTask(userId: string, id: string, input: MoveTaskInput) {
  return prisma.$transaction(async (tx) => {
    const current = await findOwned(tx, userId, id);

    const siblings = await tx.task.findMany({
      where: { userId, status: input.status, NOT: { id } },
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
      select: { id: true },
    });
    let index: number;
    if (input.afterId !== undefined) {
      if (input.afterId === null) {
        index = 0;
      } else {
        const anchor = siblings.findIndex((s) => s.id === input.afterId);
        if (anchor === -1) throw AppError.badRequest('afterId không thuộc cột đích');
        index = anchor + 1;
      }
    } else {
      index = Math.min(input.position ?? 0, siblings.length);
    }
    const ordered = [...siblings.slice(0, index).map((s) => s.id), id, ...siblings.slice(index).map((s) => s.id)];

    for (const [pos, taskId] of ordered.entries()) {
      if (taskId === id) continue;
      await tx.task.update({ where: { id: taskId }, data: { position: pos } });
    }

    const moved = await tx.task.update({
      where: { id },
      data: {
        status: input.status,
        position: index,
        completedAt: completedAtFor(input.status, current.status === TaskStatus.DONE ? current.completedAt : null),
      },
    });

    if (current.status !== input.status) {
      const source = await tx.task.findMany({
        where: { userId, status: current.status },
        orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
        select: { id: true },
      });
      for (const [pos, s] of source.entries()) {
        await tx.task.update({ where: { id: s.id }, data: { position: pos } });
      }
    }
    return moved;
  });
}

export async function deleteTask(userId: string, id: string) {
  const { count } = await prisma.task.deleteMany({ where: { id, userId } });
  if (count === 0) throw AppError.notFound('Không tìm thấy công việc');
}
