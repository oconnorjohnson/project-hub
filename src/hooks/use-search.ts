"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";
import { Workspace, Project } from "@/lib/types";

// Search result types
interface SearchResultWorkspace extends Workspace {
  type: "workspace";
  userRole: string;
}

interface SearchResultProject extends Project {
  type: "project";
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
}

type SearchResult = SearchResultWorkspace | SearchResultProject;

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  type: string;
}

interface SearchParams {
  query: string;
  type?: "workspaces" | "projects" | "all";
  excludeIds?: string[];
  limit?: number;
}

// Query keys
export const searchKeys = {
  all: ["search"] as const,
  searches: () => [...searchKeys.all, "searches"] as const,
  search: (params: SearchParams) => [...searchKeys.searches(), params] as const,
};

// Search hook
export function useSearch(params: SearchParams, enabled: boolean = true) {
  const { query, type = "all", excludeIds = [], limit = 20 } = params;

  return useQuery({
    queryKey: searchKeys.search(params),
    queryFn: async (): Promise<SearchResponse> => {
      const searchParams = new URLSearchParams({
        query,
        type,
        limit: limit.toString(),
      });

      if (excludeIds.length > 0) {
        searchParams.set("excludeIds", excludeIds.join(","));
      }

      const response = await apiClient(`/search?${searchParams.toString()}`);
      return response.data;
    },
    enabled: enabled && query.length > 0,
    staleTime: 30000, // 30 seconds
  });
}

// Debounced search hook
export function useDebouncedSearch(
  params: SearchParams,
  debounceMs: number = 300
) {
  const [debouncedQuery, setDebouncedQuery] = useState(params.query);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(params.query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [params.query, debounceMs]);

  return useSearch(
    { ...params, query: debouncedQuery },
    debouncedQuery.length > 0
  );
}

// Helper function to filter search results by type
export function filterSearchResults<T extends SearchResult>(
  results: SearchResult[],
  type: T["type"]
): T[] {
  return results.filter((result): result is T => result.type === type);
}
