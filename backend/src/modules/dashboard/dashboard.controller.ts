import { Request, Response } from 'express'
import * as dashboardService from '@modules/dashboard/dashboard.service'
import { sendSuccess, sendError } from '@shared/utils/apiResponse.util'

export const getStats = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query
    if (!workspaceId || typeof workspaceId !== 'string') {
      return sendError(res, 'workspaceId is required', 400)
    }
    const stats = await dashboardService.getStats(workspaceId, req.userId!)
    sendSuccess(res, stats)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to get stats', 400)
  }
}

export const getUpcomingTasks = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query
    if (!workspaceId || typeof workspaceId !== 'string') {
      return sendError(res, 'workspaceId is required', 400)
    }
    const upcomingTasks = await dashboardService.getUpcomingTasks(workspaceId, req.userId!)
    sendSuccess(res, upcomingTasks)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to get upcoming tasks', 400)
  }
}

export const getWorkload = async (req: Request, res: Response) => {
  try {
    const { workspaceId } = req.query
    if (!workspaceId || typeof workspaceId !== 'string') {
      return sendError(res, 'workspaceId is required', 400)
    }
    const workload = await dashboardService.getWorkload(workspaceId, req.userId!)
    sendSuccess(res, workload)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to get resource workload', 403)
  }
}
