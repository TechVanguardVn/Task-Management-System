import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('12345678', 12);

  const user1 = await prisma.user.upsert({
    where: {
      email: 'demo1@test.com',
    },
    update: {},
    create: {
      name: 'Demo User 1',
      email: 'demo1@test.com',
      password,
    },
  });

  const user2 = await prisma.user.upsert({
    where: {
      email: 'demo2@test.com',
    },
    update: {},
    create: {
      name: 'Demo User 2',
      email: 'demo2@test.com',
      password,
    },
  });

  await prisma.task.deleteMany({
    where: {
      userId: {
        in: [user1.id, user2.id],
      },
    },
  });

  await prisma.task.createMany({
    data: [
      {
        userId: user1.id,
        title: 'Learn NestJS',
        description: 'Study NestJS fundamentals',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2026-10-01'),
      },
      {
        userId: user1.id,
        title: 'Build Task Management API',
        description: 'Implement REST API for task management',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2026-10-03'),
      },
      {
        userId: user1.id,
        title: 'Write unit tests',
        description: 'Write Jest unit tests for authentication',
        status: 'DONE',
        priority: 'MEDIUM',
        dueDate: new Date('2026-09-27'),
      },
      {
        userId: user2.id,
        title: 'Design frontend',
        description: 'Create UI for task management',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2026-10-05'),
      },
      {
        userId: user2.id,
        title: 'Implement Kanban board',
        description: 'Add drag and drop task management',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date('2026-10-07'),
      },
      {
        userId: user2.id,
        title: 'Setup project',
        description: 'Initialize development environment',
        status: 'DONE',
        priority: 'LOW',
        dueDate: new Date('2026-09-25'),
      },
    ],
  });

  console.log('Seed completed successfully.');
  console.log('Demo users:');
  console.log('demo1@test.com / 12345678');
  console.log('demo2@test.com / 12345678');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });