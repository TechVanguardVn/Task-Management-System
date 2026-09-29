import type { AuthResponse } from '../types'
import client from './client'

export const login = (email: string, password: string) => client.post<AuthResponse>('/api/auth/login', { email, password }).then((r) => r.data)
export const register = (fullName: string, email: string, password: string) => client.post('/api/auth/register', { fullName, email, password }).then((r) => r.data)
