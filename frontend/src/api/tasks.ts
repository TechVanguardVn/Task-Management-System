import type { Dashboard, Task, TaskInput, TaskPage, TaskPriority, TaskStatus } from '../types'
import client from './client'

export interface TaskQuery { keyword?: string; status?: TaskStatus; priority?: TaskPriority; page?: number; size?: number }
export const getTasks = (params: TaskQuery) => client.get<TaskPage>('/api/tasks', { params }).then((r) => r.data)
export const getTask = (id: Task['id']) => client.get<Task>(`/api/tasks/${id}`).then((r) => r.data)
export const createTask = (input: TaskInput) => client.post<Task>('/api/tasks', input).then((r) => r.data)
export const updateTask = (id: Task['id'], input: TaskInput) => client.put<Task>(`/api/tasks/${id}`, input).then((r) => r.data)
export const updateTaskStatus = (id: Task['id'], status: TaskStatus) => client.patch<Task>(`/api/tasks/${id}/status`, { status }).then((r) => r.data)
export const deleteTask = (id: Task['id']) => client.delete(`/api/tasks/${id}`)
export const getDashboard = () => client.get<Dashboard>('/api/dashboard').then((r) => r.data)
