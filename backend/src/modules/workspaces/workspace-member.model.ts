import mongoose, { Document, Schema, Types } from 'mongoose'
import { WorkspaceRole, WorkspaceRoleEnum } from './workspace.schema'

export interface IWorkspaceMember extends Document {
  workspaceId: Types.ObjectId
  userId: Types.ObjectId
  role: WorkspaceRole
  joinedAt: Date
}

const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: WorkspaceRoleEnum.options, default: 'MEMBER' },
    joinedAt: { type: Date, default: Date.now },
  }
)

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true })
workspaceMemberSchema.index({ userId: 1 })

export const WorkspaceMemberModel = mongoose.model<IWorkspaceMember>('WorkspaceMember', workspaceMemberSchema)
