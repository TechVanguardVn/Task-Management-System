import mongoose, { Document, Schema, Types } from 'mongoose'
import { TaskStatusEnum, TaskPriorityEnum, TaskStatus, TaskPriority } from '@modules/tasks/task.schema'

export type { TaskStatus, TaskPriority }

export interface ITask extends Document {
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date
  userId: Types.ObjectId
  workspaceId: Types.ObjectId
  assigneeId?: Types.ObjectId
  order: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    status: { type: String, enum: TaskStatusEnum.options, default: 'TODO' },
    priority: { type: String, enum: TaskPriorityEnum.options, default: 'MEDIUM' },
    dueDate: { type: Date },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    assigneeId: { type: Schema.Types.ObjectId, ref: 'User' },
    order: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
)

taskSchema.index({ workspaceId: 1, status: 1 })
taskSchema.index({ workspaceId: 1, priority: 1 })
taskSchema.index({ workspaceId: 1, dueDate: 1 })
taskSchema.index({ workspaceId: 1, title: 'text' })
taskSchema.index({ assigneeId: 1 })

export const TaskModel = mongoose.model<ITask>('Task', taskSchema)
