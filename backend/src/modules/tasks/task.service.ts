import { TaskModel, ITask } from '@modules/tasks/task.model'
import { CreateTaskInput, UpdateTaskInput, GetTasksQuery } from '@modules/tasks/task.schema'
import { PaginatedResult } from '@shared/types/api.types'
import { WorkspaceMemberModel } from '@modules/workspaces/workspace-member.model'

export const getTasks = async (
  userId: string,
  query: GetTasksQuery
): Promise<PaginatedResult<ITask>> => {
  const { workspaceId, assigneeId, status, priority, search, tags, sortBy, sortOrder, page, limit } = query
  
  const filter: Record<string, unknown> = {}

  if (workspaceId && workspaceId.trim() !== '') {
    const membership = await WorkspaceMemberModel.findOne({ workspaceId, userId })
    if (!membership) throw new Error('Unauthorized or Workspace not found')
    filter.workspaceId = workspaceId
  } else {
    const memberships = await WorkspaceMemberModel.find({ userId })
    const workspaceIds = memberships.map(m => m.workspaceId)
    if (workspaceIds.length === 0) {
      return { items: [], total: 0, page, limit, totalPages: 0 }
    }
    filter.workspaceId = { $in: workspaceIds }
  }
  
  if (assigneeId) filter.assigneeId = assigneeId
  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (search) {
    filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' }
  }
  if (tags) {
    filter.tags = { $in: tags.split(',').map(t => t.trim()).filter(Boolean) }
  }

  const sortDirection = sortOrder === 'asc' ? 1 : -1
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    TaskModel.find(filter)
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(limit)
      .populate('assigneeId', 'fullName email avatar'),
    TaskModel.countDocuments(filter),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export const getTaskById = async (id: string, userId: string): Promise<ITask> => {
  const task = await TaskModel.findById(id)
  if (!task) throw new Error('Task not found')
  
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: task.workspaceId, userId })
  if (!membership) throw new Error('Unauthorized access to this task')

  return task
}

export const createTask = async (userId: string, input: CreateTaskInput): Promise<ITask> => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: input.workspaceId, userId })
  if (!membership) throw new Error('Unauthorized to create task in this workspace')
  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
    throw new Error('Only Workspace Admins or Owners can create tasks')
  }

  if (input.assigneeId) {
    const assigneeMembership = await WorkspaceMemberModel.findOne({ workspaceId: input.workspaceId, userId: input.assigneeId })
    if (!assigneeMembership) {
      throw new Error('Assignee is not a member of this workspace')
    }
  }

  const lastTask = await TaskModel.findOne({ workspaceId: input.workspaceId, status: input.status }).sort({ order: -1 })
  const order = lastTask ? lastTask.order + 1 : 0

  return TaskModel.create({
    ...input,
    userId,
    order,
    dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
  })
}

export const updateTask = async (
  id: string,
  userId: string,
  input: UpdateTaskInput
): Promise<ITask> => {
  const existingTask = await TaskModel.findById(id)
  if (!existingTask) throw new Error('Task not found')
  
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: existingTask.workspaceId, userId })
  if (!membership) throw new Error('Unauthorized to update this task')

  if (membership.role === 'MEMBER') {
    if (existingTask.assigneeId?.toString() !== userId) {
      throw new Error('Members can only update their own assigned tasks')
    }
  }

  if (existingTask.status === 'DONE' && input.status !== 'TODO' && input.status !== 'IN_PROGRESS') {
    throw new Error('Cannot update a completed task. Please revert its status first.')
  }

  if ('assigneeId' in input) {
    const newAssigneeId = input.assigneeId ? input.assigneeId.toString() : null
    const oldAssigneeId = existingTask.assigneeId ? existingTask.assigneeId.toString() : null
    
    if (newAssigneeId !== oldAssigneeId) {
      if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
        throw new Error('Only Workspace Admins or Owners can assign or reassign tasks')
      }
      if (newAssigneeId) {
        const assigneeMembership = await WorkspaceMemberModel.findOne({ workspaceId: existingTask.workspaceId, userId: newAssigneeId })
        if (!assigneeMembership) {
          throw new Error('Assignee is not a member of this workspace')
        }
      }
    }
  }

  const updateData: Record<string, unknown> = { ...input }
  if (input.dueDate) updateData.dueDate = new Date(input.dueDate)

  const task = await TaskModel.findOneAndUpdate(
    { _id: id },
    updateData,
    { new: true, runValidators: true }
  )
  if (!task) throw new Error('Task not found')
  return task
}

export const deleteTask = async (id: string, userId: string): Promise<void> => {
  const task = await TaskModel.findById(id)
  if (!task) throw new Error('Task not found')
  
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: task.workspaceId, userId })
  if (!membership) throw new Error('Unauthorized to delete this task')
  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
    throw new Error('Only Workspace Admins or Owners can delete tasks')
  }

  if (task.status === 'DONE') {
    throw new Error('Cannot delete a completed task')
  }

  await TaskModel.findByIdAndDelete(id)
}

export const updateTaskStatus = async (
  id: string,
  userId: string,
  status: ITask['status']
): Promise<ITask> => {
  const existingTask = await TaskModel.findById(id)
  if (!existingTask) throw new Error('Task not found')
  
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: existingTask.workspaceId, userId })
  if (!membership) throw new Error('Unauthorized to update this task')

  if (membership.role === 'MEMBER') {
    if (existingTask.assigneeId?.toString() !== userId) {
      throw new Error('Members can only update the status of their own assigned tasks')
    }
  }

  const task = await TaskModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  )
  if (!task) throw new Error('Task not found')
  return task
}

export const reorderTasks = async (
  userId: string,
  taskOrders: { id: string; order: number; status: ITask['status'] }[]
): Promise<void> => {
  // To avoid multiple queries in loop, assume all tasks belong to same workspace and user has access
  // or verify each one. Since it's a drag-and-drop array, usually from one board.
  // For safety, checking the first one:
  if (taskOrders.length === 0) return
  const sampleTask = await TaskModel.findById(taskOrders[0].id)
  if (!sampleTask) throw new Error('Task not found')
  
  const membership = await WorkspaceMemberModel.findOne({ workspaceId: sampleTask.workspaceId, userId })
  if (!membership) throw new Error('Unauthorized to reorder tasks')

  // Verify all tasks belong to this workspace to prevent cross-workspace tampering
  const taskIds = taskOrders.map(t => t.id)
  const tasksCount = await TaskModel.countDocuments({ _id: { $in: taskIds }, workspaceId: sampleTask.workspaceId })
  if (tasksCount !== taskIds.length) {
    throw new Error('Invalid tasks or cross-workspace reordering is not allowed')
  }

  await Promise.all(
    taskOrders.map(({ id, order, status }) =>
      TaskModel.findByIdAndUpdate(id, { order, status })
    )
  )
}
