"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  ProjectReference,
  CreateProjectReferenceData,
  Project,
  Workspace,
  User,
} from "@/lib/types";

// Extended types for API responses
interface ProjectReferenceWithDetails extends ProjectReference {
  targetProject?: Project & { workspace: Workspace };
  sourceProject?: Project & { workspace: Workspace };
  targetWorkspace?: Workspace;
  sourceWorkspace?: Workspace;
  createdByUser?: User;
}

interface ProjectReferencesResponse {
  outgoing: ProjectReferenceWithDetails[];
  incoming: ProjectReferenceWithDetails[];
}

// Query keys
export const projectReferenceKeys = {
  all: ["project-references"] as const,
  lists: () => [...projectReferenceKeys.all, "list"] as const,
  list: (projectId: string) =>
    [...projectReferenceKeys.lists(), { projectId }] as const,
};

// Get project references
export function useProjectReferences(projectId: string) {
  return useQuery({
    queryKey: projectReferenceKeys.list(projectId),
    queryFn: async (): Promise<ProjectReferencesResponse> => {
      const response = await apiClient(`/projects/${projectId}/references`);
      return response.data;
    },
    enabled: !!projectId,
  });
}

// Create project reference
export function useCreateProjectReference(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateProjectReferenceData
    ): Promise<ProjectReferenceWithDetails> => {
      const response = await apiClient(`/projects/${projectId}/references`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate project references
      queryClient.invalidateQueries({
        queryKey: projectReferenceKeys.list(projectId),
      });

      // Also invalidate search results as they might be affected
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

// Delete project reference
export function useDeleteProjectReference(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referenceId: string): Promise<void> => {
      await apiClient(`/project-references/${referenceId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalidate project references
      queryClient.invalidateQueries({
        queryKey: projectReferenceKeys.list(projectId),
      });
    },
  });
}
