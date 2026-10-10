import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  password: string
  fullName: string
  avatar?: string
  isEmailVerified: boolean
  verificationToken?: string
  verificationTokenExpiresAt?: Date
  refreshTokens: string[]
  createdAt: Date
  updatedAt: Date
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    fullName: { type: String, required: true, trim: true },
    avatar: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationTokenExpiresAt: { type: Date },
    refreshTokens: { type: [String], default: [] },
  },
  { timestamps: true }
)

userSchema.index({ email: 1 })

export const UserModel = mongoose.model<IUser>('User', userSchema)
