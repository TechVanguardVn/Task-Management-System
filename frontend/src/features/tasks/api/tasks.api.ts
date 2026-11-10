import { apiFetch } from "../../../lib/api-client";
import type { TaskPriority, TaskStatus } from "../../../types/project.types";
import type {
  ListTasksFilterParams,
  ListTasksResponse,
  Task,
} from "../../../types/task.types";

export interface CreateTaskPayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export async function fetchProjectTasks(
  projectId: string,
  params: ListTasksFilterParams = {},
): Promise<ListTasksResponse> {
  const query = new URLSearchParams();

  if (params.search && params.search.trim().length > 0) {
    query.set("search", params.search.trim());
  }
  if (params.status && params.status !== "ALL") {
    query.set("status", params.status);
  }
  if (params.priority && params.priority !== "ALL") {
    query.set("priority", params.priority);
  }
  if (params.sortBy) {
    query.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    query.set("sortOrder", params.sortOrder);
  }
  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }

  const queryString = query.toString();
  const path = queryString
    ? `/projects/${encodeURIComponent(projectId)}/tasks?${queryString}`
    : `/projects/${encodeURIComponent(projectId)}/tasks`;

  return apiFetch<ListTasksResponse>(path);
}

export async function fetchTaskById(taskId: string): Promise<Task> {
  const response = await apiFetch<{ task: Task }>(
    `/tasks/${encodeURIComponent(taskId)}`,
  );
  return response.task;
}

export async function createProjectTask(
  projectId: string,
  payload: CreateTaskPayload,
): Promise<Task> {
  const response = await apiFetch<{ task: Task }>(
    `/projects/${encodeURIComponent(projectId)}/tasks`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
  return response.task;
}

export async function updateTask(
  taskId: string,
  payload: UpdateTaskPayload,
): Promise<Task> {
  const response = await apiFetch<{ task: Task }>(
    `/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
  return response.task;
}

export async function deleteTask(taskId: string): Promise<void> {
  await apiFetch<{ status: string; taskId: string }>(
    `/tasks/${encodeURIComponent(taskId)}`,
    {
      method: "DELETE",
    },
  );
}
