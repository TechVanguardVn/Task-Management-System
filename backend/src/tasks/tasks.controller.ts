import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskQueryDto } from './dto/task-query.dto';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
    constructor(private readonly tasksService: TasksService) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@Req() req: any, @Body() createTaskDto: CreateTaskDto) {
        return this.tasksService.create(req.user.id, createTaskDto);
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    findAll(
        @Req() req: any,
        @Query() query: TaskQueryDto,
    ) {
        return this.tasksService.findAll(req.user.id, query);
    }

    @Get('dashboard')
    @UseGuards(JwtAuthGuard)
    getDashboard(@Req() req: any) {
        return this.tasksService.getDashboard(req.user.id);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.tasksService.findOne(req.user.id, Number(id));
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    update(
        @Req() req: any,
        @Param('id') id: string,
        @Body() updateTaskDto: UpdateTaskDto,
    ) {
        return this.tasksService.update(
            req.user.id,
            Number(id),
            updateTaskDto,
        );
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    remove(
        @Req() req: any,
        @Param('id') id: string,
    ) {
        return this.tasksService.remove(
            req.user.id,
            Number(id),
        );
    }
}
