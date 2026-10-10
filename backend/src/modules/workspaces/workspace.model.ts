import mongoose, { Document, Schema, Types } from 'mongoose'

export interface IWorkspace extends Document {
  name: string
  description?: string
  logoUrl?: string
  ownerId: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const workspaceSchema = new Schema<IWorkspace>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    logoUrl: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
)

// Indexing for faster queries
workspaceSchema.index({ ownerId: 1 })
workspaceSchema.index({ name: 'text' })

export const WorkspaceModel = mongoose.model<IWorkspace>('Workspace', workspaceSchema)
