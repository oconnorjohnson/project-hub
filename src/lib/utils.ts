import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a URL-friendly slug from a name
 * Converts to lowercase, replaces spaces with dashes, removes special characters
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .replace(/[^a-z0-9-]/g, "") // Remove special characters except dashes
    .replace(/-+/g, "-") // Replace multiple consecutive dashes with single dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes
}
