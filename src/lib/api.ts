import { auth } from "@clerk/nextjs/server";

// Base API configuration
const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://your-domain.com"
    : "http://localhost:2000";

// Client-side API calls (with auth headers)
export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Server-side API calls (for server components)
export async function serverApiClient(
  endpoint: string,
  options: RequestInit = {}
) {
  const { getToken } = await auth();
  const token = await getToken();

  const url = `${API_BASE_URL}/api${endpoint}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Types for our API responses
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
