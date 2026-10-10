import { Request, Response } from 'express'
import * as taskService from '@modules/tasks/task.service'
import { sendSuccess, sendError } from '@shared/utils/apiResponse.util'
import { GetTasksQuery } from '@modules/tasks/task.schema'
import { isValidObjectId } from '@shared/utils/objectId.util'

const guardId = (res: Response, id: string): boolean => {
  if (!isValidObjectId(id)) {
    sendError(res, 'Invalid task ID', 400)
    return false
  }
  return true
}

export const getTasks = async (req: Request, res: Response) => {
  try {
    const result = await taskService.getTasks(req.userId!, req.query as unknown as GetTasksQuery)
    sendSuccess(res, result)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to get tasks', 400)
  }
}

export const getTaskById = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    const task = await taskService.getTaskById(req.params.id, req.userId!)
    sendSuccess(res, task)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Task not found', 404)
  }
}

export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await taskService.createTask(req.userId!, req.body)
    sendSuccess(res, task, 'Task created', 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to create task', 400)
  }
}

export const updateTask = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    const task = await taskService.updateTask(req.params.id, req.userId!, req.body)
    sendSuccess(res, task, 'Task updated')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Task not found', 404)
  }
}

export const deleteTask = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    await taskService.deleteTask(req.params.id, req.userId!)
    sendSuccess(res, null, 'Task deleted')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Task not found', 404)
  }
}

export const updateTaskStatus = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    const task = await taskService.updateTaskStatus(
      req.params.id,
      req.userId!,
      req.body.status
    )
    sendSuccess(res, task, 'Status updated')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Task not found', 404)
  }
}

export const reorderTasks = async (req: Request, res: Response) => {
  try {
    await taskService.reorderTasks(req.userId!, req.body.taskOrders)
    sendSuccess(res, null, 'Tasks reordered')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to reorder tasks', 400)
  }
}
