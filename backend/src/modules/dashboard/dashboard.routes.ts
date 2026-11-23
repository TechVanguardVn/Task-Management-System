import { Router } from 'express';
import { z } from 'zod';
import { TaskStatus } from '@prisma/client';
import { getAuth, requireAuth } from '../../middleware/auth';
import { prisma } from '../../lib/prisma';

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

const querySchema = z.object({
  /** Số ngày tới được coi là "sắp đến hạn" */
  days: z.coerce.number().int().min(1).max(90).default(7),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

dashboardRouter.get('/', async (req, res) => {
  const { userId } = getAuth(req);
  const { days, limit } = querySchema.parse(req.query);
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 3600 * 1000);
  const notDone = { not: TaskStatus.DONE };

  const [byStatus, byPriority, overdueCount, upcoming, overdue] = await prisma.$transaction([
    prisma.task.groupBy({ by: ['status'], where: { userId }, _count: { _all: true }, orderBy: { status: 'asc' } }),
    prisma.task.groupBy({
      by: ['priority'],
      where: { userId, status: notDone },
      _count: { _all: true },
      orderBy: { priority: 'asc' },
    }),
    prisma.task.count({ where: { userId, status: notDone, dueDate: { lt: now } } }),
    prisma.task.findMany({
      where: { userId, status: notDone, dueDate: { gte: now, lte: until } },
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      take: limit,
    }),
    prisma.task.findMany({
      where: { userId, status: notDone, dueDate: { lt: now } },
      orderBy: { dueDate: 'asc' },
      take: limit,
    }),
  ]);

  const count = (s: TaskStatus) => {
    const row = byStatus.find((r) => r.status === s);
    return typeof row?._count === 'object' ? (row._count._all ?? 0) : 0;
  };
  const todo = count(TaskStatus.TODO);
  const inProgress = count(TaskStatus.IN_PROGRESS);
  const done = count(TaskStatus.DONE);
  const total = todo + inProgress + done;

  const priority = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const row of byPriority) {
    priority[row.priority] = typeof row._count === 'object' ? (row._count._all ?? 0) : 0;
  }

  res.json({
    stats: {
      total,
      todo,
      inProgress,
      done,
      overdue: overdueCount,
      completionRate: total === 0 ? 0 : Math.round((done / total) * 100),
    },
    openByPriority: priority,
    upcoming,
    overdue,
    upcomingWindowDays: days,
  });
});
