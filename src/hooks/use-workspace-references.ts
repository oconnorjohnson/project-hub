"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  WorkspaceReference,
  CreateWorkspaceReferenceData,
  Workspace,
  User,
} from "@/lib/types";

// Extended types for API responses
interface WorkspaceReferenceWithDetails extends WorkspaceReference {
  targetWorkspace?: Workspace;
  sourceWorkspace?: Workspace;
  createdByUser?: User;
}

interface WorkspaceReferencesResponse {
  outgoing: WorkspaceReferenceWithDetails[];
  incoming: WorkspaceReferenceWithDetails[];
}

// Query keys
export const workspaceReferenceKeys = {
  all: ["workspace-references"] as const,
  lists: () => [...workspaceReferenceKeys.all, "list"] as const,
  list: (workspaceId: string) =>
    [...workspaceReferenceKeys.lists(), { workspaceId }] as const,
};

// Get workspace references
export function useWorkspaceReferences(workspaceId: string) {
  return useQuery({
    queryKey: workspaceReferenceKeys.list(workspaceId),
    queryFn: async (): Promise<WorkspaceReferencesResponse> => {
      const response = await apiClient(`/workspaces/${workspaceId}/references`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

// Create workspace reference
export function useCreateWorkspaceReference(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateWorkspaceReferenceData
    ): Promise<WorkspaceReferenceWithDetails> => {
      const response = await apiClient(
        `/workspaces/${workspaceId}/references`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate workspace references
      queryClient.invalidateQueries({
        queryKey: workspaceReferenceKeys.list(workspaceId),
      });

      // Also invalidate search results as they might be affected
      queryClient.invalidateQueries({ queryKey: ["search"] });
    },
  });
}

// Delete workspace reference
export function useDeleteWorkspaceReference(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (referenceId: string): Promise<void> => {
      await apiClient(`/workspace-references/${referenceId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalidate workspace references
      queryClient.invalidateQueries({
        queryKey: workspaceReferenceKeys.list(workspaceId),
      });
    },
  });
}
