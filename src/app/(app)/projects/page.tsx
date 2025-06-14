"use client";

import { useState } from "react";
import {
  Plus,
  FolderOpen,
  Calendar,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useProjects,
  useWorkspaces,
  useCreateProject,
  useCreateWorkspace,
} from "@/hooks";
import { toast } from "sonner";
import { useAtom } from "jotai";
import { currentWorkspaceAtom } from "@/lib/stores/workspace";
import { generateSlug } from "@/lib/utils";

export default function ProjectsPage() {
  const [currentWorkspace] = useAtom(currentWorkspaceAtom);
  const { data: projects, isLoading: projectsLoading } = useProjects(
    currentWorkspace?.id
  );
  const { data: workspaces, isLoading: workspacesLoading } = useWorkspaces();
  const { mutateAsync: createProject } = useCreateProject();
  const { mutateAsync: createWorkspace } = useCreateWorkspace();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreateWorkspaceDialogOpen, setIsCreateWorkspaceDialogOpen] =
    useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  // State for auto-generating slugs
  const [projectName, setProjectName] = useState("");
  const [projectSlug, setProjectSlug] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceSlug, setWorkspaceSlug] = useState("");

  const isLoading = projectsLoading || workspacesLoading;

  // Don't allow project creation if no workspace is selected
  const canCreateProject = currentWorkspace !== null;

  // Auto-generate project slug when name changes
  const handleProjectNameChange = (name: string) => {
    setProjectName(name);
    setProjectSlug(generateSlug(name));
  };

  // Auto-generate workspace slug when name changes
  const handleWorkspaceNameChange = (name: string) => {
    setWorkspaceName(name);
    setWorkspaceSlug(generateSlug(name));
  };

  const handleCreateWorkspace = async (formData: FormData) => {
    setIsCreatingWorkspace(true);
    try {
      const name = formData.get("name") as string;
      const slug = formData.get("slug") as string;
      const description = formData.get("description") as string;

      await createWorkspace({
        name,
        slug,
        description,
      });

      toast.success("Workspace created successfully!");
      setIsCreateWorkspaceDialogOpen(false);
      // Reset form state
      setWorkspaceName("");
      setWorkspaceSlug("");
    } catch (error) {
      toast.error("Failed to create workspace. Please try again.");
      console.error("Error creating workspace:", error);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleCreateProject = async (formData: FormData) => {
    if (!workspaces || workspaces.length === 0) {
      toast.error("No workspace available. Please create a workspace first.");
      setIsCreateDialogOpen(false);
      setIsCreateWorkspaceDialogOpen(true);
      return;
    }

    setIsCreating(true);
    try {
      const name = formData.get("name") as string;
      const slug = formData.get("slug") as string;
      const description = formData.get("description") as string;
      const workspaceId = formData.get("workspaceId") as string;
      const tags =
        (formData.get("tags") as string)
          ?.split(",")
          .map((t) => t.trim())
          .filter(Boolean) || [];

      await createProject({
        name,
        slug,
        description,
        workspaceId,
        tags,
      });

      toast.success("Project created successfully!");
      setIsCreateDialogOpen(false);
      // Reset form state
      setProjectName("");
      setProjectSlug("");
    } catch (error) {
      toast.error("Failed to create project. Please try again.");
      console.error("Error creating project:", error);
    } finally {
      setIsCreating(false);
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            {currentWorkspace
              ? `Manage projects in ${currentWorkspace.name} workspace`
              : "Manage your projects and track progress across all initiatives"}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={!canCreateProject}>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          {canCreateProject ? (
            <DialogContent className="sm:max-w-[425px]">
              <form action={handleCreateProject}>
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Add a new project to organize your work and collaborate with
                    your team.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={projectName}
                      onChange={(e) => handleProjectNameChange(e.target.value)}
                      placeholder="Enter project name"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="slug">Project Slug</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={projectSlug}
                      onChange={(e) => setProjectSlug(e.target.value)}
                      placeholder="project-slug"
                      pattern="^[a-z0-9-]+$"
                      title="Only lowercase letters, numbers, and hyphens allowed"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Auto-generated from project name. You can edit if needed.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="workspaceId">Workspace</Label>
                    <Select
                      name="workspaceId"
                      required
                      defaultValue={currentWorkspace?.id}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select workspace" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspaces?.map((workspace) => (
                          <SelectItem key={workspace.id} value={workspace.id}>
                            {workspace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your project..."
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="tags">Tags (Optional)</Label>
                    <Input
                      id="tags"
                      name="tags"
                      placeholder="frontend, design, urgent (comma-separated)"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          ) : null}
        </Dialog>

        {/* Workspace Creation Dialog */}
        <Dialog
          open={isCreateWorkspaceDialogOpen}
          onOpenChange={setIsCreateWorkspaceDialogOpen}
        >
          <DialogContent className="sm:max-w-[425px]">
            <form action={handleCreateWorkspace}>
              <DialogHeader>
                <DialogTitle>Create New Workspace</DialogTitle>
                <DialogDescription>
                  Create a workspace to organize your projects and collaborate
                  with your team.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="workspace-name">Workspace Name</Label>
                  <Input
                    id="workspace-name"
                    name="name"
                    value={workspaceName}
                    onChange={(e) => handleWorkspaceNameChange(e.target.value)}
                    placeholder="Enter workspace name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workspace-slug">Workspace Slug</Label>
                  <Input
                    id="workspace-slug"
                    name="slug"
                    value={workspaceSlug}
                    onChange={(e) => setWorkspaceSlug(e.target.value)}
                    placeholder="workspace-slug"
                    pattern="^[a-z0-9-]+$"
                    title="Only lowercase letters, numbers, and hyphens allowed"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-generated from workspace name. You can edit if needed.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="workspace-description">
                    Description (Optional)
                  </Label>
                  <Textarea
                    id="workspace-description"
                    name="description"
                    placeholder="Describe your workspace..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateWorkspaceDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreatingWorkspace}>
                  {isCreatingWorkspace && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Workspace
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects List or Empty State */}
      {projects && projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      {project.workspace.name}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>
                        {project.isArchived ? "Unarchive" : "Archive"}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                {project.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {project.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                  {project.isArchived && (
                    <Badge variant="outline">Archived</Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(project.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <FolderOpen className="h-3 w-3" />
                    View
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Get started by creating your first project. Organize your tasks,
            documents, and timeline all in one place.
          </p>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Project
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}
    </div>
  );
}
