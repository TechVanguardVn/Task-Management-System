import { apiFetch } from "../../../lib/api-client";
import type {
  ListProjectsFilterParams,
  ListProjectsResponse,
  Project,
  ProjectStatus,
  ProjectSummary,
} from "../../../types/project.types";
import type { ProjectFormValues } from "../schemas/project.schema";

export interface CreateProjectPayload {
  name: string;
  description: string | null;
  color: string | null;
  startDate: string | null;
  dueDate: string | null;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string | null;
  color?: string | null;
  status?: ProjectStatus;
  startDate?: string | null;
  dueDate?: string | null;
}

export function toProjectPayload(values: ProjectFormValues): CreateProjectPayload & { status: ProjectStatus } {
  return {
    name: values.name.trim(),
    description: values.description.trim() ? values.description.trim() : null,
    color: values.color.trim() || "#2563eb",
    status: values.status,
    startDate: values.startDate.trim() ? values.startDate.trim() : null,
    dueDate: values.dueDate.trim() ? values.dueDate.trim() : null,
  };
}

export async function fetchProjects(
  params: ListProjectsFilterParams = {},
): Promise<ListProjectsResponse> {
  const searchParams = new URLSearchParams();

  if (params.status && params.status !== "ALL") {
    searchParams.set("status", params.status);
  }
  if (params.search && params.search.trim().length > 0) {
    searchParams.set("search", params.search.trim());
  }
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const queryString = searchParams.toString();
  const path = queryString ? `/projects?${queryString}` : "/projects";

  return apiFetch<ListProjectsResponse>(path);
}

export async function fetchProjectById(projectId: string): Promise<Project> {
  const data = await apiFetch<{ project: Project }>(`/projects/${projectId}`);
  return data.project;
}

export async function fetchProjectSummary(projectId: string): Promise<ProjectSummary> {
  const data = await apiFetch<{ summary: ProjectSummary }>(`/projects/${projectId}/summary`);
  return data.summary;
}

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const data = await apiFetch<{ project: Project }>("/projects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.project;
}

export async function updateProject(
  projectId: string,
  payload: UpdateProjectPayload,
): Promise<Project> {
  const data = await apiFetch<{ project: Project }>(`/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return data.project;
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch<{ status: string; projectId: string }>(`/projects/${projectId}`, {
    method: "DELETE",
  });
}
