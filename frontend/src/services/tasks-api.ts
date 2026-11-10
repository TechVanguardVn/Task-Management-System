import axios from "axios";

import { apiClient } from "../lib/api-client";
import { normalizeApiError } from "../lib/api-errors";
import type {
  PaginatedTasksResponse,
  Task,
  TaskCreatePayload,
  TaskFilterParams,
  TaskStatusUpdatePayload,
  TaskUpdatePayload,
} from "../types/task";

async function request<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (axios.isCancel(error)) {
      throw error;
    }

    throw normalizeApiError(error);
  }
}

function buildFilterParams(params: TaskFilterParams): TaskFilterParams {
  const query: TaskFilterParams = {};

  if (params.search !== undefined) {
    query.search = params.search;
  }
  if (params.status !== undefined) {
    query.status = params.status;
  }
  if (params.priority !== undefined) {
    query.priority = params.priority;
  }
  if (params.page !== undefined) {
    query.page = params.page;
  }
  if (params.page_size !== undefined) {
    query.page_size = params.page_size;
  }

  return query;
}

function buildCreatePayload(payload: TaskCreatePayload): TaskCreatePayload {
  const body: TaskCreatePayload = { title: payload.title };

  if (payload.description !== undefined) {
    body.description = payload.description;
  }
  if (payload.status !== undefined) {
    body.status = payload.status;
  }
  if (payload.priority !== undefined) {
    body.priority = payload.priority;
  }
  if (payload.due_date !== undefined) {
    body.due_date = payload.due_date;
  }

  return body;
}

function buildUpdatePayload(payload: TaskUpdatePayload): TaskUpdatePayload {
  return {
    title: payload.title,
    description: payload.description,
    status: payload.status,
    priority: payload.priority,
    due_date: payload.due_date,
  };
}

export function listTasks(
  params: TaskFilterParams,
  signal?: AbortSignal,
): Promise<PaginatedTasksResponse> {
  return request(async () => {
    const response = await apiClient.get<PaginatedTasksResponse>("/tasks", {
      params: buildFilterParams(params),
      signal,
    });

    return response.data;
  });
}

export function getTask(id: number, signal?: AbortSignal): Promise<Task> {
  return request(async () => {
    const response = await apiClient.get<Task>(`/tasks/${id}`, { signal });
    return response.data;
  });
}

export function createTask(payload: TaskCreatePayload): Promise<Task> {
  return request(async () => {
    const response = await apiClient.post<Task>(
      "/tasks",
      buildCreatePayload(payload),
    );
    return response.data;
  });
}

export function updateTask(
  id: number,
  payload: TaskUpdatePayload,
): Promise<Task> {
  return request(async () => {
    const response = await apiClient.put<Task>(
      `/tasks/${id}`,
      buildUpdatePayload(payload),
    );
    return response.data;
  });
}

export function patchTaskStatus(
  id: number,
  payload: TaskStatusUpdatePayload,
): Promise<Task> {
  return request(async () => {
    const response = await apiClient.patch<Task>(`/tasks/${id}/status`, {
      status: payload.status,
    });
    return response.data;
  });
}

export function deleteTask(id: number): Promise<void> {
  return request(async () => {
    await apiClient.delete<void>(`/tasks/${id}`);
  });
}
