"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Document,
  DocumentWithProject,
  DocumentWithLock,
  CreateDocumentData,
  UpdateDocumentData,
  DocumentFilters,
  DocumentLockStatus,
} from "@/lib/types";

// Query keys
export const documentKeys = {
  all: ["documents"] as const,
  lists: () => [...documentKeys.all, "list"] as const,
  list: (filters?: DocumentFilters) =>
    [...documentKeys.lists(), filters] as const,
  details: () => [...documentKeys.all, "detail"] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  locks: () => [...documentKeys.all, "lock"] as const,
  lock: (id: string) => [...documentKeys.locks(), id] as const,
};

// Get documents with filtering
export function useDocuments(filters?: DocumentFilters) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: async (): Promise<Document[]> => {
      const params = new URLSearchParams();

      if (filters?.projectId) params.append("projectId", filters.projectId);
      if (filters?.global) params.append("global", "true");
      if (filters?.search) params.append("search", filters.search);
      if (filters?.sortBy) params.append("sortBy", filters.sortBy);
      if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);

      const queryString = params.toString();
      const response = await apiClient(
        `/documents${queryString ? `?${queryString}` : ""}`
      );
      return response.data;
    },
  });
}

// Get single document by ID
export function useDocument(documentId: string) {
  return useQuery({
    queryKey: documentKeys.detail(documentId),
    queryFn: async (): Promise<DocumentWithLock> => {
      const response = await apiClient(`/documents/${documentId}`);
      return response.data;
    },
    enabled: !!documentId,
  });
}

// Create new document
export function useCreateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentData): Promise<Document> => {
      const response = await apiClient("/documents", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (newDocument) => {
      // Invalidate and refetch document lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });

      // Add the new document to the cache
      queryClient.setQueryData(
        documentKeys.detail(newDocument.id),
        newDocument
      );
    },
  });
}

// Update document
export function useUpdateDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateDocumentData;
    }): Promise<Document> => {
      const response = await apiClient(`/documents/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: (updatedDocument) => {
      // Update the document in cache
      queryClient.setQueryData(
        documentKeys.detail(updatedDocument.id),
        updatedDocument
      );

      // Invalidate document lists to reflect changes
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Delete document
export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<void> => {
      await apiClient(`/documents/${documentId}`, {
        method: "DELETE",
      });
    },
    onSuccess: (_, documentId) => {
      // Remove document from cache
      queryClient.removeQueries({ queryKey: documentKeys.detail(documentId) });

      // Invalidate document lists
      queryClient.invalidateQueries({ queryKey: documentKeys.lists() });
    },
  });
}

// Document lock management
export function useDocumentLock(documentId: string) {
  const queryClient = useQueryClient();

  const lockQuery = useQuery({
    queryKey: documentKeys.lock(documentId),
    queryFn: async (): Promise<DocumentLockStatus> => {
      const response = await apiClient(`/documents/${documentId}/lock`);
      return response.data;
    },
    enabled: !!documentId,
    refetchInterval: 30000, // Check lock status every 30 seconds
  });

  const acquireLock = useMutation({
    mutationFn: async (): Promise<any> => {
      const response = await apiClient(`/documents/${documentId}/lock`, {
        method: "POST",
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate lock status to refresh
      queryClient.invalidateQueries({
        queryKey: documentKeys.lock(documentId),
      });
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(documentId),
      });
    },
  });

  const releaseLock = useMutation({
    mutationFn: async (sessionId: string): Promise<void> => {
      await apiClient(`/documents/${documentId}/lock?sessionId=${sessionId}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      // Invalidate lock status to refresh
      queryClient.invalidateQueries({
        queryKey: documentKeys.lock(documentId),
      });
      queryClient.invalidateQueries({
        queryKey: documentKeys.detail(documentId),
      });
    },
  });

  return {
    lockStatus: lockQuery.data,
    isLoadingLockStatus: lockQuery.isLoading,
    acquireLock: acquireLock.mutateAsync,
    isAcquiringLock: acquireLock.isPending,
    releaseLock: releaseLock.mutateAsync,
    isReleasingLock: releaseLock.isPending,
  };
}

// Auto-save hook for document content
export function useAutoSaveDocument(documentId: string, enabled = true) {
  const { mutateAsync: updateDocument } = useUpdateDocument();

  const autoSave = useMutation({
    mutationFn: async (content: any) => {
      return updateDocument({
        id: documentId,
        data: { content },
      });
    },
  });

  return {
    autoSave: autoSave.mutateAsync,
    isAutoSaving: autoSave.isPending,
    autoSaveError: autoSave.error,
  };
}
