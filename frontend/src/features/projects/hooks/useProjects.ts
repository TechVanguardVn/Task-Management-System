import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ListProjectsFilterParams } from "../../../types/project.types";
import {
  type CreateProjectPayload,
  createProject,
  deleteProject,
  fetchProjectById,
  fetchProjectSummary,
  fetchProjects,
  type UpdateProjectPayload,
  updateProject,
} from "../api/projects.api";

export const PROJECTS_QUERY_KEY = ["projects"] as const;

export function useProjectsList(params: ListProjectsFilterParams = {}) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, "list", params] as const,
    queryFn: () => fetchProjects(params),
  });
}

export function useProjectDetail(projectId: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, "detail", projectId] as const,
    queryFn: () => fetchProjectById(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useProjectSummary(projectId: string | undefined) {
  return useQuery({
    queryKey: [...PROJECTS_QUERY_KEY, "summary", projectId] as const,
    queryFn: () => fetchProjectSummary(projectId!),
    enabled: Boolean(projectId),
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProjectPayload) => createProject(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      payload,
    }: {
      projectId: string;
      payload: UpdateProjectPayload;
    }) => updateProject(projectId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => deleteProject(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROJECTS_QUERY_KEY });
    },
  });
}
