import { Request, Response } from 'express'
import * as workspaceService from './workspace.service'
import { sendSuccess, sendError } from '@shared/utils/apiResponse.util'
import { GetWorkspacesQuery } from './workspace.schema'
import { isValidObjectId } from '@shared/utils/objectId.util'

const guardId = (res: Response, id: string): boolean => {
  if (!isValidObjectId(id)) {
    sendError(res, 'Invalid workspace ID', 400)
    return false
  }
  return true
}

export const createWorkspace = async (req: Request, res: Response) => {
  try {
    const workspace = await workspaceService.createWorkspace(req.userId!, req.body)
    sendSuccess(res, workspace, 'Workspace created successfully', 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to create workspace', 400)
  }
}

export const getWorkspaces = async (req: Request, res: Response) => {
  try {
    const result = await workspaceService.getWorkspaces(req.userId!, req.query as unknown as GetWorkspacesQuery)
    sendSuccess(res, result)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to get workspaces', 400)
  }
}

export const getWorkspaceById = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    const workspace = await workspaceService.getWorkspaceById(req.params.id, req.userId!)
    sendSuccess(res, workspace)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Workspace not found', 404)
  }
}

export const updateWorkspace = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    const workspace = await workspaceService.updateWorkspace(req.params.id, req.userId!, req.body)
    sendSuccess(res, workspace, 'Workspace updated successfully')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to update workspace', 400)
  }
}

export const deleteWorkspace = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    await workspaceService.deleteWorkspace(req.params.id, req.userId!)
    sendSuccess(res, null, 'Workspace deleted successfully')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to delete workspace', 400)
  }
}

export const getWorkspaceMembers = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    const members = await workspaceService.getWorkspaceMembers(req.params.id, req.userId!)
    sendSuccess(res, members)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to get members', 400)
  }
}

export const addWorkspaceMember = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  try {
    const member = await workspaceService.addWorkspaceMember(req.params.id, req.userId!, req.body.email, req.body.role)
    sendSuccess(res, member, 'Member added successfully', 201)
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to add member', 400)
  }
}

export const removeWorkspaceMember = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  if (!guardId(res, req.params.memberId)) return
  try {
    await workspaceService.removeWorkspaceMember(req.params.id, req.userId!, req.params.memberId)
    sendSuccess(res, null, 'Member removed successfully')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to remove member', 400)
  }
}

export const updateWorkspaceMemberRole = async (req: Request, res: Response) => {
  if (!guardId(res, req.params.id)) return
  if (!guardId(res, req.params.memberId)) return
  try {
    const member = await workspaceService.updateWorkspaceMemberRole(req.params.id, req.userId!, req.params.memberId, req.body.role)
    sendSuccess(res, member, 'Member role updated successfully')
  } catch (err) {
    sendError(res, err instanceof Error ? err.message : 'Failed to update member role', 400)
  }
}
