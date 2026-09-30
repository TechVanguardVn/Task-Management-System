import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { contains } from 'class-validator';
import { debugPort } from 'process';

@Injectable()
export class TasksService {
    constructor(private readonly prisma: PrismaService) { }
    async create(userId: number, createTaskDto: CreateTaskDto) {
        const { title, description, priority, dueDate } = createTaskDto;

        return this.prisma.task.create({
            data: {
                userId,
                title,
                description,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            },
        });
    }

    async findAll(userId: number, query: TaskQueryDto) {
        const {
            search,
            status,
            priority,
            page = 1,
            limit = 10,
        } = query;
        const where = {
            userId,
            ...(search && {
                title: {
                    contains: search,
                    mode: 'insensitive' as const,
                },
            }),
            ...(status && {
                status,
            }),
            ...(priority && {
                priority,
            }),
        };

        const skip = (page - 1) * limit;

        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.task.count({
                where,
            }),
        ]);
        return {
            data: tasks,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getDashboard(userId: number) {
        const [total, todo, inProgress, done, upcomingTasks] =
            await Promise.all([
                this.prisma.task.count({
                    where: { userId },
                }),

                this.prisma.task.count({
                    where: {
                        userId,
                        status: 'TODO',
                    },
                }),
                this.prisma.task.count({
                    where: {
                        userId,
                        status: 'IN_PROGRESS',
                    },
                }),
                this.prisma.task.count({
                    where: {
                        userId,
                        status: 'DONE',
                    },
                }),
                this.prisma.task.findMany({
                    where: {
                        userId,
                        status: {
                            not: 'DONE',
                        },
                        dueDate: {
                            gte: new Date(),
                        },
                    },
                    orderBy: {
                        dueDate: 'asc',
                    },
                    take: 5,
                }),
            ]);
        return {
            total,
            todo,
            inProgress,
            done,
            upcomingTasks,
        };
    }
    async findOne(userId: number, taskId: number) {
        const task = await this.prisma.task.findFirst({
            where: {
                id: taskId,
                userId,
            },
        });

        if (!task) {
            throw new NotFoundException('Task not found');
        }

        return task;
    }

    async update(
        userId: number,
        taskId: number,
        updateTaskDto: UpdateTaskDto,
    ) {
        await this.findOne(userId, taskId);

        const { title, description, status, priority, dueDate } = updateTaskDto;

        return this.prisma.task.update({
            where: {
                id: taskId,
            },
            data: {
                title,
                description,
                status,
                priority,
                dueDate: dueDate ? new Date(dueDate) : undefined,
            },
        });
    }

    async remove(userId: number, taskId: number) {
        await this.findOne(userId, taskId);

        await this.prisma.task.delete({
            where: {
                id: taskId,
            },
        });

        return {
            message: 'Task deleted successfully',
        };
    }


}