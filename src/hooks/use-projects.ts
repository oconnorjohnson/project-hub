"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Project, CreateProjectData, ProjectWithWorkspace } from "@/lib/types";

// Query keys
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (workspaceId?: string) =>
    [...projectKeys.lists(), { workspaceId }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Get all projects for current user
export function useProjects(workspaceId?: string) {
  return useQuery({
    queryKey: projectKeys.list(workspaceId),
    queryFn: async (): Promise<ProjectWithWorkspace[]> => {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const response = await apiClient(`/projects${params}`);
      return response.data;
    },
  });
}

// Get single project by ID
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async (): Promise<ProjectWithWorkspace> => {
      const response = await apiClient(`/projects/${projectId}`);
      return response.data;
    },
    enabled: !!projectId,
  });
}

// Create new project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectData): Promise<Project> => {
      const response = await apiClient("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (newProject) => {
      // Invalidate and refetch projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });

      // Add the new project to the cache
      queryClient.setQueryData(projectKeys.detail(newProject.id), newProject);
    },
  });
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateProjectData>;
    }): Promise<Project> => {
      const response = await apiClient(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (updatedProject) => {
      // Update the project in cache
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.id),
        updatedProject
      );

      // Invalidate projects list to reflect changes
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string): Promise<void> => {
      await apiClient(`/projects/${projectId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, projectId) => {
      // Remove project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(projectId) });

      // Invalidate projects list
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Archive/unarchive project
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      isArchived,
    }: {
      id: string;
      isArchived: boolean;
    }): Promise<Project> => {
      const response = await apiClient(`/projects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isArchived }),
      });
      return response.data;
    },
    onSuccess: (updatedProject) => {
      queryClient.setQueryData(
        projectKeys.detail(updatedProject.id),
        updatedProject
      );
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}
