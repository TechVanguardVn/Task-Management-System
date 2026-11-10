import { AxiosError, CanceledError } from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "../lib/api-client";
import type {
  PaginatedTasksResponse,
  Task,
  TaskCreatePayload,
  TaskStatusUpdatePayload,
  TaskUpdatePayload,
} from "../types/task";
import {
  createTask,
  deleteTask,
  getTask,
  listTasks,
  patchTaskStatus,
  updateTask,
} from "./tasks-api";

vi.mock("../lib/api-client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockedGet = vi.mocked(apiClient.get);
const mockedPost = vi.mocked(apiClient.post);
const mockedPut = vi.mocked(apiClient.put);
const mockedPatch = vi.mocked(apiClient.patch);
const mockedDelete = vi.mocked(apiClient.delete);

const TASK: Task = {
  id: 42,
  user_id: 7,
  title: "Nộp báo cáo thử việc",
  description: "Hoàn thiện báo cáo trước cuối tuần.",
  status: "IN_PROGRESS",
  priority: "HIGH",
  due_date: "2026-11-20T09:00:00Z",
  created_at: "2026-11-01T08:00:00Z",
  updated_at: "2026-11-05T10:30:00Z",
};

const PAGINATED_TASKS: PaginatedTasksResponse = {
  items: [TASK],
  total: 1,
  page: 1,
  page_size: 10,
  total_pages: 1,
};

function createAxiosError(status: number, data: unknown): AxiosError {
  const config = { headers: {} } as InternalAxiosRequestConfig;
  const response = {
    data,
    status,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse;

  return new AxiosError(
    "Request failed",
    AxiosError.ERR_BAD_RESPONSE,
    config,
    undefined,
    response,
  );
}

describe("tasks API", () => {
  beforeEach(() => {
    mockedGet.mockReset();
    mockedPost.mockReset();
    mockedPut.mockReset();
    mockedPatch.mockReset();
    mockedDelete.mockReset();
  });

  it("lists tasks through the tasks endpoint and returns pagination metadata", async () => {
    mockedGet.mockResolvedValue({
      data: PAGINATED_TASKS,
    } as AxiosResponse<PaginatedTasksResponse>);

    await expect(listTasks({})).resolves.toEqual(PAGINATED_TASKS);
    expect(mockedGet).toHaveBeenCalledWith("/tasks", {
      params: {},
      signal: undefined,
    });
  });

  it("forwards search, status, priority, page, page_size, and the abort signal", async () => {
    mockedGet.mockResolvedValue({
      data: PAGINATED_TASKS,
    } as AxiosResponse<PaginatedTasksResponse>);

    const params = {
      search: "báo cáo",
      status: "IN_PROGRESS" as const,
      priority: "HIGH" as const,
      page: 2,
      page_size: 20,
    };
    const controller = new AbortController();

    await listTasks(params, controller.signal);

    expect(mockedGet).toHaveBeenCalledWith("/tasks", {
      params,
      signal: controller.signal,
    });
  });

  it("gets a task detail by id and forwards the abort signal", async () => {
    mockedGet.mockResolvedValue({
      data: TASK,
    } as AxiosResponse<Task>);

    const controller = new AbortController();

    await expect(getTask(TASK.id, controller.signal)).resolves.toEqual(TASK);
    expect(mockedGet).toHaveBeenCalledWith(`/tasks/${TASK.id}`, {
      signal: controller.signal,
    });
  });

  it("creates a task with the provided payload and returns the response task", async () => {
    mockedPost.mockResolvedValue({
      data: TASK,
    } as AxiosResponse<Task>);

    const payload: TaskCreatePayload = {
      title: TASK.title,
      description: TASK.description,
      status: TASK.status,
      priority: TASK.priority,
      due_date: TASK.due_date,
    };

    await expect(createTask(payload)).resolves.toEqual(TASK);
    expect(mockedPost).toHaveBeenCalledWith("/tasks", payload);
  });

  it("does not send read-only fields when creating a task", async () => {
    mockedPost.mockResolvedValue({
      data: TASK,
    } as AxiosResponse<Task>);

    await createTask(TASK);

    expect(mockedPost).toHaveBeenCalledWith("/tasks", {
      title: TASK.title,
      description: TASK.description,
      status: TASK.status,
      priority: TASK.priority,
      due_date: TASK.due_date,
    });
  });

  it("updates a task using all five required fields", async () => {
    mockedPut.mockResolvedValue({
      data: TASK,
    } as AxiosResponse<Task>);

    const payload: TaskUpdatePayload = {
      title: TASK.title,
      description: TASK.description,
      status: TASK.status,
      priority: TASK.priority,
      due_date: TASK.due_date,
    };

    await expect(updateTask(TASK.id, payload)).resolves.toEqual(TASK);
    expect(mockedPut).toHaveBeenCalledWith(`/tasks/${TASK.id}`, payload);
  });

  it("does not send id, user_id, created_at, or updated_at on update", async () => {
    mockedPut.mockResolvedValue({
      data: TASK,
    } as AxiosResponse<Task>);

    await updateTask(TASK.id, TASK);

    expect(mockedPut).toHaveBeenCalledWith(`/tasks/${TASK.id}`, {
      title: TASK.title,
      description: TASK.description,
      status: TASK.status,
      priority: TASK.priority,
      due_date: TASK.due_date,
    });
  });

  it("patches only the status field", async () => {
    mockedPatch.mockResolvedValue({
      data: TASK,
    } as AxiosResponse<Task>);

    const payload: TaskStatusUpdatePayload & { note: string } = {
      status: "DONE",
      note: "must not be sent",
    };

    await expect(
      patchTaskStatus(TASK.id, payload),
    ).resolves.toEqual(TASK);
    expect(mockedPatch).toHaveBeenCalledWith(
      `/tasks/${TASK.id}/status`,
      { status: "DONE" },
    );
  });

  it("deletes a task without parsing the 204 response body", async () => {
    mockedDelete.mockResolvedValue({
      data: undefined,
      status: 204,
    } as AxiosResponse<void>);

    await expect(deleteTask(TASK.id)).resolves.toBeUndefined();
    expect(mockedDelete).toHaveBeenCalledWith(`/tasks/${TASK.id}`);
  });

  it("normalizes 404 responses without exposing backend details", async () => {
    mockedGet.mockRejectedValue(
      createAxiosError(404, { detail: "Task not found" }),
    );

    await expect(getTask(404)).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
      message: "The requested task was not found.",
    });
  });

  it("maps 422 validation details to task fields", async () => {
    mockedPost.mockRejectedValue(
      createAxiosError(422, {
        detail: [
          {
            loc: ["body", "title"],
            msg: "String should have at least 1 character",
          },
          {
            loc: ["body", "description"],
            msg: "Input should be a valid string",
          },
          {
            loc: ["body", "status"],
            msg: "Input should be TODO, IN_PROGRESS, or DONE",
          },
          {
            loc: ["body", "priority"],
            msg: "Input should be LOW, MEDIUM, or HIGH",
          },
          {
            loc: ["body", "due_date"],
            msg: "due_date must include a timezone offset",
          },
        ],
      }),
    );

    await expect(createTask({ title: "" })).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      fieldErrors: {
        title: "String should have at least 1 character",
        description: "Input should be a valid string",
        status: "Input should be TODO, IN_PROGRESS, or DONE",
        priority: "Input should be LOW, MEDIUM, or HIGH",
        due_date: "due_date must include a timezone offset",
      },
    });
  });

  it("preserves cancellation errors for callers supporting AbortSignal", async () => {
    const cancellation = new CanceledError("Request aborted");
    mockedGet.mockRejectedValue(cancellation);

    const controller = new AbortController();

    await expect(
      listTasks({}, controller.signal),
    ).rejects.toBe(cancellation);
  });
});
