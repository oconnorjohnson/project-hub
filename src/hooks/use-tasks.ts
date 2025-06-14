"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  TaskWithProject,
  CreateTaskData,
  TaskStatus,
  TaskPriority,
} from "@/lib/types";

// Query keys
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

export interface TaskFilters {
  projectId?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedToMe?: boolean;
  global?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Get tasks with filtering
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: async (): Promise<TaskWithProject[]> => {
      const params = new URLSearchParams();

      if (filters?.projectId) params.append("projectId", filters.projectId);
      if (filters?.status) params.append("status", filters.status);
      if (filters?.priority) params.append("priority", filters.priority);
      if (filters?.assignedToMe) params.append("assignedToMe", "true");
      if (filters?.global) params.append("global", "true");
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

      const queryString = params.toString();
      const response = await apiClient(
        `/tasks${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    },
  });
}

// Get single task by ID
export function useTask(taskId: string) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: async (): Promise<TaskWithProject> => {
      const response = await apiClient(`/tasks/${taskId}`);
      return response.data;
    },
    enabled: !!taskId,
  });
}

// Create new task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskData): Promise<TaskWithProject> => {
      const response = await apiClient("/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (newTask) => {
      // Invalidate and refetch task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });

      // Add the new task to the cache
      queryClient.setQueryData(taskKeys.detail(newTask.id), newTask);
    },
  });
}

// Update task
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateTaskData>;
    }): Promise<TaskWithProject> => {
      const response = await apiClient(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (updatedTask) => {
      // Update the task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);

      // Invalidate task lists to reflect changes
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Delete task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string): Promise<void> => {
      await apiClient(`/tasks/${taskId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, taskId) => {
      // Remove task from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(taskId) });

      // Invalidate task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Update task status (common operation)
export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: TaskStatus;
    }): Promise<TaskWithProject> => {
      const response = await apiClient(`/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          metadata: { status },
        }),
      });
      return response.data;
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

// Bulk update tasks (for kanban drag & drop)
export function useBulkUpdateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      updates: Array<{
        id: string;
        metadata: Partial<TaskWithProject["metadata"]>;
      }>
    ): Promise<TaskWithProject[]> => {
      const response = await apiClient("/tasks/bulk-update", {
        method: "PATCH",
        body: JSON.stringify({ updates }),
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all task queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
    },
  });
}
