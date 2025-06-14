"use client";

import { useState } from "react";
import {
  Plus,
  Building2,
  Users,
  Settings,
  MoreHorizontal,
  Loader2,
  Crown,
  Shield,
  User,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/hooks";
import { toast } from "sonner";

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
  VIEWER: Eye,
};

const roleColors = {
  OWNER: "text-yellow-600",
  ADMIN: "text-blue-600",
  MEMBER: "text-green-600",
  VIEWER: "text-gray-600",
};

export default function WorkspacesPage() {
  const { data: workspaces, isLoading } = useWorkspaces();
  const { mutateAsync: createWorkspace } = useCreateWorkspace();
  const { mutateAsync: updateWorkspace } = useUpdateWorkspace();
  const { mutateAsync: deleteWorkspace } = useDeleteWorkspace();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState<any>(null);

  const handleCreateWorkspace = async (formData: FormData) => {
    setIsCreating(true);
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
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error("Failed to create workspace. Please try again.");
      console.error("Error creating workspace:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateWorkspace = async (formData: FormData) => {
    if (!editingWorkspace) return;

    setIsUpdating(true);
    try {
      const name = formData.get("name") as string;
      const slug = formData.get("slug") as string;
      const description = formData.get("description") as string;

      await updateWorkspace({
        id: editingWorkspace.id,
        data: { name, slug, description },
      });

      toast.success("Workspace updated successfully!");
      setIsEditDialogOpen(false);
      setEditingWorkspace(null);
    } catch (error) {
      toast.error("Failed to update workspace. Please try again.");
      console.error("Error updating workspace:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWorkspace = async (
    workspaceId: string,
    workspaceName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete "${workspaceName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await deleteWorkspace(workspaceId);
      toast.success("Workspace deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete workspace. Please try again.");
      console.error("Error deleting workspace:", error);
    }
  };

  const openEditDialog = (workspace: any) => {
    setEditingWorkspace(workspace);
    setIsEditDialogOpen(true);
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
          <h1 className="text-3xl font-bold">Workspaces</h1>
          <p className="text-muted-foreground">
            Manage your workspaces and collaborate with your team.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Workspace
            </Button>
          </DialogTrigger>
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
                  <Label htmlFor="name">Workspace Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter workspace name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Workspace Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    placeholder="workspace-slug"
                    pattern="^[a-z0-9-]+$"
                    title="Only lowercase letters, numbers, and hyphens allowed"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
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
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Workspace
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workspaces Grid */}
      {workspaces && workspaces.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace) => {
            const RoleIcon = roleIcons[workspace.userRole.role];
            const roleColor = roleColors[workspace.userRole.role];

            return (
              <Card
                key={workspace.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg">
                          {workspace.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <RoleIcon className={`h-3 w-3 mr-1 ${roleColor}`} />
                          {workspace.userRole.role}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          /{workspace.slug}
                        </span>
                      </div>
                    </div>
                    {(workspace.userRole.role === "OWNER" ||
                      workspace.userRole.role === "ADMIN") && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => openEditDialog(workspace)}
                          >
                            <Settings className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {workspace.userRole.role === "OWNER" && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                handleDeleteWorkspace(
                                  workspace.id,
                                  workspace.name
                                )
                              }
                            >
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {workspace.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {workspace.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Member since{" "}
                      {new Date(
                        workspace.userRole.createdAt
                      ).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md">
            Create your first workspace to start organizing projects and
            collaborating with your team.
          </p>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Workspace
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      )}

      {/* Edit Workspace Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form action={handleUpdateWorkspace}>
            <DialogHeader>
              <DialogTitle>Edit Workspace</DialogTitle>
              <DialogDescription>
                Update your workspace details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Workspace Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  defaultValue={editingWorkspace?.name || ""}
                  placeholder="Enter workspace name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Workspace Slug</Label>
                <Input
                  id="edit-slug"
                  name="slug"
                  defaultValue={editingWorkspace?.slug || ""}
                  placeholder="workspace-slug"
                  pattern="^[a-z0-9-]+$"
                  title="Only lowercase letters, numbers, and hyphens allowed"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={editingWorkspace?.description || ""}
                  placeholder="Describe your workspace..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingWorkspace(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update Workspace
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
