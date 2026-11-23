import { Router } from 'express';
import { getAuth, requireAuth } from '../../middleware/auth';
import {
  boardQuerySchema,
  createTaskSchema,
  idParamSchema,
  listTasksQuerySchema,
  moveTaskSchema,
  updateTaskSchema,
} from './task.schemas';
import * as taskService from './task.service';

export const taskRouter = Router();
taskRouter.use(requireAuth);

taskRouter.get('/', async (req, res) => {
  const query = listTasksQuerySchema.parse(req.query);
  res.json(await taskService.listTasks(getAuth(req).userId, query));
});

taskRouter.get('/board', async (req, res) => {
  const query = boardQuerySchema.parse(req.query);
  res.json(await taskService.getBoard(getAuth(req).userId, query));
});

taskRouter.post('/', async (req, res) => {
  const input = createTaskSchema.parse(req.body);
  res.status(201).json(await taskService.createTask(getAuth(req).userId, input));
});

taskRouter.get('/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  res.json(await taskService.getTask(getAuth(req).userId, id));
});

taskRouter.patch('/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateTaskSchema.parse(req.body);
  res.json(await taskService.updateTask(getAuth(req).userId, id, input));
});

taskRouter.patch('/:id/move', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  const input = moveTaskSchema.parse(req.body);
  res.json(await taskService.moveTask(getAuth(req).userId, id, input));
});

taskRouter.delete('/:id', async (req, res) => {
  const { id } = idParamSchema.parse(req.params);
  await taskService.deleteTask(getAuth(req).userId, id);
  res.status(204).end();
});
