import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type { Board, DashboardData, ListParams, Paginated, Task, TaskInput, TaskStatus } from './types';

/** Mọi query liên quan tới task dùng chung prefix để invalidate một lần */
const KEY = 'tasks';

export function useTaskList(params: ListParams) {
  return useQuery({
    queryKey: [KEY, 'list', params],
    queryFn: () => api<Paginated<Task>>('/tasks', { query: { ...params } }),
    placeholderData: keepPreviousData,
  });
}

export function useBoard(filters: { search?: string; priority?: string }) {
  return useQuery({
    queryKey: [KEY, 'board', filters],
    queryFn: () => api<Board>('/tasks/board', { query: filters }),
    placeholderData: keepPreviousData,
  });
}

export function useDashboard(days = 7) {
  return useQuery({
    queryKey: [KEY, 'dashboard', days],
    queryFn: () => api<DashboardData>('/dashboard', { query: { days } }),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCreateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: TaskInput) => api<Task>('/tasks', { method: 'POST', body: input }),
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<TaskInput> & { id: string }) =>
      api<Task>(`/tasks/${id}`, { method: 'PATCH', body: input }),
    onSuccess: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/tasks/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
}

export function useMoveTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, status, afterId }: { id: string; status: TaskStatus; afterId: string | null }) =>
      api<Task>(`/tasks/${id}/move`, { method: 'PATCH', body: { status, afterId } }),
    onSettled: invalidate,
  });
}
