"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Plus,
  Home,
  Settings,
  FolderOpen,
  Building2,
  ChevronDown,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  useWorkspaces,
  useCurrentWorkspace,
  useSwitchWorkspace,
} from "@/hooks";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Projects", href: "/projects", icon: FolderOpen },
  { name: "Workspaces", href: "/workspaces", icon: Building2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: workspaces } = useWorkspaces();
  const { data: currentWorkspace } = useCurrentWorkspace();
  const { mutate: switchWorkspace } = useSwitchWorkspace();

  return (
    <div className="flex flex-col w-64 bg-card border-r">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Project Hub</h2>
      </div>

      {/* Workspace Switcher */}
      {workspaces && workspaces.length > 0 && (
        <div className="p-4 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">
                    {currentWorkspace?.name ||
                      workspaces[0]?.name ||
                      "Select Workspace"}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
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
                  {(currentWorkspace?.id === workspace.id ||
                    (!currentWorkspace &&
                      workspaces[0]?.id === workspace.id)) && (
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
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t">
        <Button className="w-full" size="sm" asChild>
          <Link href="/projects">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>
    </div>
  );
}
