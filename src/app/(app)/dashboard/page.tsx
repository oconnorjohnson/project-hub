"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  FolderOpen,
  Users,
  Calendar,
  TrendingUp,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useProjects, useWorkspaces } from "@/hooks";

export default function DashboardPage() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();

  const isLoading = projectsLoading || workspacesLoading;

  // Calculate stats from real data
  const stats = {
    totalProjects: projects?.length || 0,
    activeProjects: projects?.filter((p) => !p.isArchived).length || 0,
    totalWorkspaces: workspaces?.length || 0,
    recentProjects: projects?.slice(0, 3) || [],
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s what&apos;s happening with your projects.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeProjects} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Projects
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeProjects}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalWorkspaces}</div>
            <p className="text-xs text-muted-foreground">Organizations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Projects
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.recentProjects.length}
            </div>
            <p className="text-xs text-muted-foreground">Last 3 projects</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      {stats.recentProjects.length > 0 ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>
              Your most recently created projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{project.name}</h3>
                    {project.description && (
                      <p className="text-sm text-muted-foreground">
                        {project.description}
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {project.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                      {project.isArchived && (
                        <Badge variant="outline">Archived</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button asChild>
                <Link href="/projects">
                  <FolderOpen className="mr-2 h-4 w-4" />
                  View All Projects
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Getting Started */
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              {!workspaces || workspaces.length === 0
                ? "Create your first workspace to get started"
                : "Create your first project to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!workspaces || workspaces.length === 0 ? (
              /* No Workspaces - Show workspace creation flow */
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Create your first workspace to organize your work</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-muted-foreground">
                    Add projects to your workspace
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-muted-foreground">
                    Collaborate with your team
                  </span>
                </div>
              </div>
            ) : (
              /* Has Workspaces but no Projects - Show project creation flow */
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Create your first project to organize your work</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-muted-foreground">
                    Add tasks and documents to your project
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span className="text-muted-foreground">
                    Collaborate with your team
                  </span>
                </div>
              </div>
            )}
            <Button asChild>
              <Link
                href={
                  !workspaces || workspaces.length === 0
                    ? "/workspaces"
                    : "/projects"
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                {!workspaces || workspaces.length === 0
                  ? "Create First Workspace"
                  : "Create First Project"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
