import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TasksService', () => {
  let service: TasksService;

  const prismaMock = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create a task for the authenticated user', async () => {
      const createdTask = {
        id: 1,
        userId: 1,
        title: 'Learn PHP',
        description: 'Study PHP fundamentals',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.create.mockResolvedValue(createdTask);

      const result = await service.create(1, {
        title: 'Learn PHP',
        description: 'Study PHP fundamentals',
        priority: 'HIGH' as any,
      });

      expect(result).toEqual(createdTask);

      expect(prismaMock.task.create).toHaveBeenCalledWith({
        data: {
          userId: 1,
          title: 'Learn PHP',
          description: 'Study PHP fundamentals',
          priority: 'HIGH',
          dueDate: undefined,
        },
      });
    });
  });
  describe('findAll', () => {
    it('should return filtered and paginated tasks', async () => {
      const tasks = [
        {
          id: 1,
          userId: 1,
          title: 'Learn PHP',
          description: 'Study PHP',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.findMany.mockResolvedValue(tasks);
      prismaMock.task.count.mockResolvedValue(1);

      const result = await service.findAll(1, {
        search: 'PHP',
        status: 'TODO' as any,
        priority: 'HIGH' as any,
        page: 1,
        limit: 10,
      });

      expect(result).toEqual({
        data: tasks,
        meta: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      });

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          title: {
            contains: 'PHP',
            mode: 'insensitive',
          },
          status: 'TODO',
          priority: 'HIGH',
        },
        skip: 0,
        take: 10,
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(prismaMock.task.count).toHaveBeenCalledWith({
        where: {
          userId: 1,
          title: {
            contains: 'PHP',
            mode: 'insensitive',
          },
          status: 'TODO',
          priority: 'HIGH',
        },
      });
    });
  });
  describe('findOne', () => {
    it('should return a task belonging to the user', async () => {
      const task = {
        id: 1,
        userId: 1,
        title: 'Learn PHP',
        description: 'Study PHP',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.task.findFirst.mockResolvedValue(task);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(task);

      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 1,
        },
      });
    });

    it('should throw NotFoundException when the task does not belong to the user', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne(2, 1)).rejects.toThrow(
        'Task not found',
      );

      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 2,
        },
      });
    });
  });
  describe('update', () => {
    it('should update a task belonging to the user', async () => {
      const existingTask = {
        id: 1,
        userId: 1,
        title: 'Learn PHP',
        description: 'Study PHP',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTask = {
        ...existingTask,
        title: 'Learn PHP Advanced',
        status: 'IN_PROGRESS',
      };

      prismaMock.task.findFirst.mockResolvedValue(existingTask);
      prismaMock.task.update.mockResolvedValue(updatedTask);

      const result = await service.update(1, 1, {
        title: 'Learn PHP Advanced',
        status: 'IN_PROGRESS' as any,
      });

      expect(result).toEqual(updatedTask);

      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 1,
        },
      });

      expect(prismaMock.task.update).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
        data: {
          title: 'Learn PHP Advanced',
          description: undefined,
          status: 'IN_PROGRESS',
          priority: undefined,
          dueDate: undefined,
        },
      });
    });

    it('should not update a task belonging to another user', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(
        service.update(2, 1, {
          title: 'Hacked task',
        }),
      ).rejects.toThrow('Task not found');

      expect(prismaMock.task.update).not.toHaveBeenCalled();
    });
  });
  describe('remove', () => {
    it('should delete a task belonging to the user', async () => {
      prismaMock.task.findFirst.mockResolvedValue({
        id: 1,
        userId: 1,
        title: 'Learn PHP',
      });

      prismaMock.task.delete.mockResolvedValue({
        id: 1,
      });

      const result = await service.remove(1, 1);

      expect(result).toEqual({
        message: 'Task deleted successfully',
      });

      expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 1,
          userId: 1,
        },
      });

      expect(prismaMock.task.delete).toHaveBeenCalledWith({
        where: {
          id: 1,
        },
      });
    });

    it('should not delete a task belonging to another user', async () => {
      prismaMock.task.findFirst.mockResolvedValue(null);

      await expect(service.remove(2, 1)).rejects.toThrow(
        'Task not found',
      );

      expect(prismaMock.task.delete).not.toHaveBeenCalled();
    });
  });
  describe('getDashboard', () => {
    it('should return task statistics and upcoming tasks', async () => {
      const upcomingTasks = [
        {
          id: 3,
          userId: 1,
          title: 'Prepare Demo',
          description: null,
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date('2026-10-01T09:00:00.000Z'),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      prismaMock.task.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(2) // todo
        .mockResolvedValueOnce(1) // inProgress
        .mockResolvedValueOnce(2); // done

      prismaMock.task.findMany.mockResolvedValue(upcomingTasks);

      const result = await service.getDashboard(1);

      expect(result).toEqual({
        total: 5,
        todo: 2,
        inProgress: 1,
        done: 2,
        upcomingTasks,
      });

      expect(prismaMock.task.findMany).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: {
            not: 'DONE',
          },
          dueDate: {
            gte: expect.any(Date),
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        take: 5,
      });
    });
  });

});