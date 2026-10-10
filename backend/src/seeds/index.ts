import mongoose from 'mongoose'
import { connectDB } from '@shared/config/db.config'
import { UserModel } from '@modules/auth/user.model'
import { TaskModel } from '@modules/tasks/task.model'
import { WorkspaceModel } from '@modules/workspaces/workspace.model'
import { WorkspaceMemberModel } from '@modules/workspaces/workspace-member.model'
import { hashPassword } from '@shared/utils/hash.util'

const seed = async () => {
  await connectDB()

  await UserModel.deleteMany({})
  await TaskModel.deleteMany({})
  await WorkspaceModel.deleteMany({})
  await WorkspaceMemberModel.deleteMany({})

  const pass1 = await hashPassword('Password123')
  const pass2 = await hashPassword('123456')

  const [owner, member] = await UserModel.insertMany([
    { email: 'user@example.com', password: pass1, fullName: 'John Owner', isEmailVerified: true },
    { email: 'user2@gmail.com', password: pass2, fullName: 'Jane Member', isEmailVerified: true },
  ])

  const [workspace] = await WorkspaceModel.insertMany([
    { name: 'Công ty TechVanguardVn', description: 'TechVanguardVn Workspace', ownerId: owner._id },
  ])

  await WorkspaceMemberModel.insertMany([
    { workspaceId: workspace._id, userId: owner._id, role: 'OWNER' },
    { workspaceId: workspace._id, userId: member._id, role: 'MEMBER' },
  ])

  const statuses = ['TODO', 'IN_PROGRESS', 'DONE'] as const
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const

  const buildTasks = (userId: mongoose.Types.ObjectId, wsId: mongoose.Types.ObjectId) =>
    Array.from({ length: 8 }, (_, i) => ({
      title: `Task ${i + 1} — ${['Design', 'Implement', 'Review', 'Test', 'Deploy', 'Document', 'Refactor', 'Fix'][i]}`,
      description: `Detailed description for task ${i + 1}`,
      status: statuses[i % 3],
      priority: priorities[i % 4],
      userId,
      workspaceId: wsId,
      order: i,
      tags: ['sample', i % 2 === 0 ? 'frontend' : 'backend'],
      dueDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
    }))

  await TaskModel.insertMany([...buildTasks(owner._id, workspace._id), ...buildTasks(member._id, workspace._id)])

  console.log('Seed complete: 2 users, 1 workspace, 16 tasks')
  process.exit(0)
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
