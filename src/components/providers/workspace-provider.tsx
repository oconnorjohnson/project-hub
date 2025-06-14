"use client";

import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import {
  currentWorkspaceIdAtom,
  currentWorkspaceAtom,
} from "@/lib/stores/workspace";
import { useWorkspaces } from "@/hooks";

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { data: workspaces } = useWorkspaces();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useAtom(
    currentWorkspaceIdAtom
  );
  const setCurrentWorkspace = useSetAtom(currentWorkspaceAtom);

  useEffect(() => {
    if (!workspaces || workspaces.length === 0) {
      setCurrentWorkspace(null);
      return;
    }

    // Find current workspace from the list
    const currentWorkspace = workspaces.find(
      (w) => w.id === currentWorkspaceId
    );

    if (currentWorkspace) {
      setCurrentWorkspace(currentWorkspace);
    } else {
      // If stored workspace ID is invalid or null, default to first workspace
      const firstWorkspace = workspaces[0];
      setCurrentWorkspaceId(firstWorkspace.id);
      setCurrentWorkspace(firstWorkspace);
    }
  }, [
    workspaces,
    currentWorkspaceId,
    setCurrentWorkspaceId,
    setCurrentWorkspace,
  ]);

  return <>{children}</>;
}
