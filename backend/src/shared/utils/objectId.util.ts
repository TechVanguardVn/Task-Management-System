import { Types } from 'mongoose'

export const isValidObjectId = (id: string): boolean => Types.ObjectId.isValid(id)
