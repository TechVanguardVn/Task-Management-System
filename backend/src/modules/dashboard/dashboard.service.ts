import { Types } from 'mongoose'
import { TaskModel } from '@modules/tasks/task.model'
import { WorkspaceMemberModel } from '@modules/workspaces/workspace-member.model'

const getMembership = async (workspaceId: string, userId: string) => {
  const membership = await WorkspaceMemberModel.findOne({ workspaceId, userId })
  if (!membership) {
    throw new Error('Access denied: You are not a member of this workspace')
  }
  return membership
}

export const getStats = async (workspaceId: string, userId: string) => {
  const membership = await getMembership(workspaceId, userId)
  const wsObjectId = new Types.ObjectId(workspaceId)

  const matchQuery: any = { workspaceId: wsObjectId }
  if (membership.role === 'MEMBER') {
    matchQuery.assigneeId = new Types.ObjectId(userId)
  }

  const [statusStats, priorityStats, total, overdueCount] = await Promise.all([
    TaskModel.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    TaskModel.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    TaskModel.countDocuments(matchQuery),
    TaskModel.countDocuments({
      ...matchQuery,
      status: { $ne: 'DONE' },
      dueDate: { $lt: new Date() }
    })
  ])

  const statusCounts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 }
  statusStats.forEach(item => {
    if (item._id in statusCounts) {
      statusCounts[item._id as keyof typeof statusCounts] = item.count
    }
  })

  const priorityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 }
  priorityStats.forEach(item => {
    if (item._id in priorityCounts) {
      priorityCounts[item._id as keyof typeof priorityCounts] = item.count
    }
  })

  const completionRate = total === 0 ? 0 : Math.round((statusCounts.DONE / total) * 100)

  return { total, statusCounts, priorityCounts, overdueCount, completionRate }
}

export const getUpcomingTasks = async (workspaceId: string, userId: string) => {
  const membership = await getMembership(workspaceId, userId)

  const query: any = {
    workspaceId,
    status: { $ne: 'DONE' },
    dueDate: { $ne: null }
  }

  if (membership.role === 'MEMBER') {
    query.assigneeId = userId
  }

  const upcomingTasks = await TaskModel.find(query)
    .sort({ dueDate: 1 })
    .limit(5)
    .populate('assigneeId', 'fullName avatar')
    .lean()

  return upcomingTasks.map(task => ({
    id: task._id,
    title: task.title,
    priority: task.priority,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null,
    assignee: task.assigneeId || { fullName: 'Unassigned', avatar: '' }
  }))
}

export const getWorkload = async (workspaceId: string, userId: string) => {
  const membership = await getMembership(workspaceId, userId)

  if (membership.role !== 'OWNER' && membership.role !== 'ADMIN') {
    throw new Error('Access denied: Only Admin and Owner can view resource workload')
  }

  const workload = await TaskModel.aggregate([
    {
      $match: {
        workspaceId: new Types.ObjectId(workspaceId),
        status: { $in: ['TODO', 'IN_PROGRESS'] },
        assigneeId: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$assigneeId',
        activeTasks: { $sum: 1 }
      }
    },
    { $sort: { activeTasks: -1 } },
    { $limit: 5 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'workspacemembers',
        let: { userId: '$_id', wsId: new Types.ObjectId(workspaceId) },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$workspaceId', '$$wsId'] }] } } }
        ],
        as: 'membership'
      }
    },
    { $unwind: { path: '$membership', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        activeTasks: 1,
        assignee: {
          fullName: '$user.fullName',
          avatar: '$user.avatar',
          role: { $ifNull: ['$membership.role', 'MEMBER'] }
        }
      }
    }
  ])

  return workload
}
