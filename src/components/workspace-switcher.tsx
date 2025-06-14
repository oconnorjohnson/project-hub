"use client";

import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAtom, useSetAtom } from "jotai";
import {
  currentWorkspaceAtom,
  switchWorkspaceAtom,
} from "@/lib/stores/workspace";
import { useWorkspaces } from "@/hooks";
import Link from "next/link";

export function WorkspaceSwitcher() {
  const { data: workspaces } = useWorkspaces();
  const [currentWorkspace] = useAtom(currentWorkspaceAtom);
  const switchWorkspace = useSetAtom(switchWorkspaceAtom);

  if (!workspaces || workspaces.length === 0) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/workspaces">
          <Plus className="h-4 w-4 mr-2" />
          Create Workspace
        </Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="min-w-[200px] justify-between"
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="truncate">
              {currentWorkspace?.name || "Select Workspace"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onClick={() => switchWorkspace(workspace.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>{workspace.name}</span>
            </div>
            {currentWorkspace?.id === workspace.id && (
              <Check className="h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/workspaces">
            <Plus className="h-4 w-4 mr-2" />
            Manage Workspaces
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
