export interface User {
  _id: string
  email: string
  fullName: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  user: User
}
