import { WorkspaceModel, IWorkspace } from './workspace.model'
import { WorkspaceMemberModel, IWorkspaceMember } from './workspace-member.model'
import { UserModel } from '@modules/auth/user.model'
import { TaskModel } from '@modules/tasks/task.model'
import { CreateWorkspaceInput, UpdateWorkspaceInput, GetWorkspacesQuery } from './workspace.schema'
import { PaginatedResult } from '@shared/types/api.types'

export const createWorkspace = async (userId: string, input: CreateWorkspaceInput): Promise<IWorkspace> => {
  const workspace = await WorkspaceModel.create({
    ...input,
    ownerId: userId
  })

  await WorkspaceMemberModel.create({
    workspaceId: workspace._id,
    userId,
    role: 'OWNER'
  })

  return workspace
}

export const getWorkspaces = async (
  userId: string,
  query: GetWorkspacesQuery
): Promise<PaginatedResult<IWorkspace & { role: string }>> => {
  const { search, role, sortBy, sortOrder, page, limit } = query

  const memberFilter: Record<string, unknown> = { userId }
  if (role) memberFilter.role = role

  const memberships = await WorkspaceMemberModel.find(memberFilter).select('workspaceId role')
  const workspaceIds = memberships.map(m => m.workspaceId)

  if (workspaceIds.length === 0) {
    return { items: [], total: 0, page, limit, totalPages: 0 }
  }

  const filter: Record<string, unknown> = { _id: { $in: workspaceIds } }
  if (search) {
    filter.name = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    WorkspaceModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .lean() as any,
    WorkspaceModel.countDocuments(filter),
  ])

  const paginatedWorkspaceIds = items.map((ws: any) => ws._id)

  const [memberCounts, activeTaskCounts] = await Promise.all([
    WorkspaceMemberModel.aggregate([
      { $match: { workspaceId: { $in: paginatedWorkspaceIds } } },
      { $group: { _id: "$workspaceId", count: { $sum: 1 } } }
    ]),
    TaskModel.aggregate([
      { $match: { workspaceId: { $in: paginatedWorkspaceIds }, status: { $in: ['TODO', 'IN_PROGRESS'] } } },
      { $group: { _id: "$workspaceId", count: { $sum: 1 } } }
    ])
  ])

  const workspacesWithRole = items.map((ws: any) => {
    const mem = memberships.find(m => m.workspaceId.toString() === ws._id.toString())
    const memberCount = memberCounts.find(m => m._id.toString() === ws._id.toString())?.count || 0
    const activeTaskCount = activeTaskCounts.find(t => t._id.toString() === ws._id.toString())?.count || 0
    
    return {
      ...ws,
      role: mem?.role || 'MEMBER',
      memberCount,
      activeTaskCount
    } as IWorkspace & { role: string, memberCount: number, activeTaskCount: number }
  })

  return {
    items: workspacesWithRole,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export const getWorkspaceById = async (id: string, userId: string): Promise<IWorkspace & { role: string }> => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: id, userId })
  if (!membership) throw new Error('Workspace not found or unauthorized')

  const workspace = await WorkspaceModel.findById(id).lean() as any
  if (!workspace) throw new Error('Workspace not found')

  return { ...workspace, role: membership.role } as IWorkspace & { role: string }
}

export const updateWorkspace = async (
  id: string,
  userId: string,
  input: UpdateWorkspaceInput
): Promise<IWorkspace> => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: id, userId })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw new Error('Unauthorized to update workspace')
  }

  const workspace = await WorkspaceModel.findByIdAndUpdate(id, input, { new: true })
  if (!workspace) throw new Error('Workspace not found')
  return workspace
}

export const deleteWorkspace = async (id: string, userId: string): Promise<void> => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: id, userId })
  if (!membership || membership.role !== 'OWNER') {
    throw new Error('Only the owner can delete the workspace')
  }

  await WorkspaceModel.findByIdAndDelete(id)
  await WorkspaceMemberModel.deleteMany({ workspaceId: id })
  await TaskModel.deleteMany({ workspaceId: id })
}

export const getWorkspaceMembers = async (workspaceId: string, userId: string) => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId, userId })
  if (!membership) {
    throw new Error('Unauthorized to view members of this workspace')
  }

  const members = await WorkspaceMemberModel.find({ workspaceId })
    .populate({
      path: 'userId',
      select: 'fullName email avatar',
    })
    .lean()

  return members.map((m: any) => ({
    id: m.userId._id.toString(),
    fullName: m.userId.fullName,
    email: m.userId.email,
    avatar: m.userId.avatar,
    role: m.role,
    joinedAt: new Date(m.joinedAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }))
}

export const addWorkspaceMember = async (workspaceId: string, inviterId: string, email: string, role: string = 'MEMBER') => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId, userId: inviterId })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw new Error('Unauthorized to add members to this workspace')
  }

  const user = await UserModel.findOne({ email: email.toLowerCase() })
  if (!user) {
    throw new Error('User with this email not found')
  }

  const existingMember = await WorkspaceMemberModel.findOne({ workspaceId, userId: user._id })
  if (existingMember) {
    throw new Error('User is already a member of this workspace')
  }

  if (role === 'OWNER' && membership.role !== 'OWNER') {
    throw new Error('Only owners can assign the OWNER role')
  }

  const newMember = await WorkspaceMemberModel.create({
    workspaceId,
    userId: user._id,
    role
  })

  return {
    id: user._id.toString(),
    fullName: user.fullName,
    email: user.email,
    avatar: user.avatar,
    role: newMember.role,
    joinedAt: new Date((newMember as any).joinedAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }
}

export const removeWorkspaceMember = async (workspaceId: string, removerId: string, memberId: string) => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId, userId: removerId })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw new Error('Unauthorized to remove members from this workspace')
  }

  const targetMembership = await WorkspaceMemberModel.findOne({ workspaceId, userId: memberId })
  if (!targetMembership) {
    throw new Error('Member not found in this workspace')
  }

  if (targetMembership.role === 'OWNER') {
    throw new Error('Cannot remove the workspace owner')
  }

  // Admin cannot remove other admins, but can remove themselves (leave workspace)
  if (membership.role === 'ADMIN' && targetMembership.role === 'ADMIN' && removerId !== memberId) {
    throw new Error('Admins cannot remove other admins')
  }

  const pendingTasksCount = await TaskModel.countDocuments({
    workspaceId,
    assigneeId: memberId,
    status: { $in: ['TODO', 'IN_PROGRESS'] }
  })

  if (pendingTasksCount > 0) {
    throw new Error(`Cannot remove member because they still have ${pendingTasksCount} pending task(s). Reassign them first.`)
  }

  await WorkspaceMemberModel.findByIdAndDelete(targetMembership._id)
}

export const updateWorkspaceMemberRole = async (workspaceId: string, updaterId: string, memberId: string, newRole: string) => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId, userId: updaterId })
  if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
    throw new Error('Unauthorized to update members in this workspace')
  }

  const targetMembership = await WorkspaceMemberModel.findOne({ workspaceId, userId: memberId })
  if (!targetMembership) {
    throw new Error('Member not found in this workspace')
  }

  if (targetMembership.role === 'OWNER') {
    throw new Error('Cannot change the role of the workspace owner')
  }
  
  if (membership.role === 'ADMIN' && targetMembership.role === 'ADMIN') {
    throw new Error('Admins cannot change the role of other admins')
  }

  if (newRole === 'OWNER' && membership.role !== 'OWNER') {
    throw new Error('Only owners can assign the OWNER role')
  }

  targetMembership.role = newRole as any
  await targetMembership.save()

  return targetMembership
}
