"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Workspace, CreateWorkspaceData, WorkspaceWithRole } from "@/lib/types";

// Query keys
export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  list: () => [...workspaceKeys.lists()] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  current: () => [...workspaceKeys.all, "current"] as const,
};

// Get all workspaces for current user
export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.list(),
    queryFn: async (): Promise<WorkspaceWithRole[]> => {
      const response = await apiClient("/workspaces");
      return response.data;
    },
  });
}

// Get single workspace by ID
export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: async (): Promise<WorkspaceWithRole> => {
      const response = await apiClient(`/workspaces/${workspaceId}`);
      return response.data;
    },
    enabled: !!workspaceId,
  });
}

// Get current/active workspace (could be stored in localStorage or context)
export function useCurrentWorkspace() {
  return useQuery({
    queryKey: workspaceKeys.current(),
    queryFn: async (): Promise<WorkspaceWithRole | null> => {
      // First try to get from localStorage
      const currentWorkspaceId = localStorage.getItem("currentWorkspaceId");
      if (!currentWorkspaceId) return null;

      const response = await apiClient(`/workspaces/${currentWorkspaceId}`);
      return response.data;
    },
  });
}

// Create new workspace
export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWorkspaceData): Promise<Workspace> => {
      const response = await apiClient("/workspaces", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (newWorkspace) => {
      // Invalidate and refetch workspaces list
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });

      // Add the new workspace to the cache
      queryClient.setQueryData(
        workspaceKeys.detail(newWorkspace.id),
        newWorkspace
      );

      // Set as current workspace
      localStorage.setItem("currentWorkspaceId", newWorkspace.id);
      queryClient.invalidateQueries({ queryKey: workspaceKeys.current() });
    },
  });
}

// Update workspace
export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateWorkspaceData>;
    }): Promise<Workspace> => {
      const response = await apiClient(`/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (updatedWorkspace) => {
      // Update the workspace in cache
      queryClient.setQueryData(
        workspaceKeys.detail(updatedWorkspace.id),
        updatedWorkspace
      );

      // Invalidate workspaces list to reflect changes
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });

      // Update current workspace if it's the one being updated
      queryClient.invalidateQueries({ queryKey: workspaceKeys.current() });
    },
  });
}

// Delete workspace
export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string): Promise<void> => {
      await apiClient(`/workspaces/${workspaceId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, workspaceId) => {
      // Remove workspace from cache
      queryClient.removeQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });

      // Invalidate workspaces list
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });

      // Clear current workspace if it was deleted
      const currentWorkspaceId = localStorage.getItem("currentWorkspaceId");
      if (currentWorkspaceId === workspaceId) {
        localStorage.removeItem("currentWorkspaceId");
        queryClient.invalidateQueries({ queryKey: workspaceKeys.current() });
      }
    },
  });
}

// Switch current workspace
export function useSwitchWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (workspaceId: string): Promise<void> => {
      localStorage.setItem("currentWorkspaceId", workspaceId);
    },
    onSuccess: () => {
      // Invalidate current workspace query to refetch
      queryClient.invalidateQueries({ queryKey: workspaceKeys.current() });

      // Also invalidate projects since they depend on workspace
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
