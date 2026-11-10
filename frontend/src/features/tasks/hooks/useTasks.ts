import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListTasksFilterParams } from "../../../types/task.types";
import { DASHBOARD_QUERY_KEY } from "../../dashboard/hooks/useDashboard";
import { PROJECTS_QUERY_KEY } from "../../projects/hooks/useProjects";
import {
  type CreateTaskPayload,
  createProjectTask,
  deleteTask,
  fetchProjectTasks,
  fetchTaskById,
  type UpdateTaskPayload,
  updateTask,
} from "../api/tasks.api";

export const TASKS_QUERY_KEY = ["tasks"] as const;

export function useProjectTasksList(
  projectId: string | undefined,
  params: ListTasksFilterParams = {},
) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, "project", projectId, params] as const,
    queryFn: () => fetchProjectTasks(projectId!, params),
    enabled: Boolean(projectId),
  });
}

export function useTaskDetail(taskId: string | undefined) {
  return useQuery({
    queryKey: [...TASKS_QUERY_KEY, "detail", taskId] as const,
    queryFn: () => fetchTaskById(taskId!),
    enabled: Boolean(taskId),
  });
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: CreateTaskPayload;
    }) => createProjectTask(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      payload,
    }: {
      taskId: string;
      payload: UpdateTaskPayload;
    }) => updateTask(taskId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}

export function useDeleteTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
      void queryClient.invalidateQueries({ queryKey: DASHBOARD_QUERY_KEY });
    },
  });
}
