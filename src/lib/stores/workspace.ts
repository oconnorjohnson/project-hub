import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type { WorkspaceWithRole } from "@/lib/types";

// Current workspace ID atom with localStorage persistence
export const currentWorkspaceIdAtom = atomWithStorage<string | null>(
  "currentWorkspaceId",
  null
);

// Current workspace object atom (writable)
export const currentWorkspaceAtom = atom<WorkspaceWithRole | null>(null);

// Action atom to switch workspace
export const switchWorkspaceAtom = atom(
  null,
  (get, set, workspaceId: string | null) => {
    set(currentWorkspaceIdAtom, workspaceId);
  }
);

// Helper atom to check if user has any workspaces
export const hasWorkspacesAtom = atom<boolean>(false);

// Helper atom to check if workspace is required for current action
export const workspaceRequiredAtom = atom<boolean>(false);
