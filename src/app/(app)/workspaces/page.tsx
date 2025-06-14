"use client";

import { useState } from "react";
import {
  Plus,
  Building2,
  Users,
  Settings,
  Trash2,
  Edit,
  MoreHorizontal,
  Loader2,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from "@/hooks";
import { toast } from "sonner";
import { WorkspaceWithRole } from "@/lib/types";
import { generateSlug } from "@/lib/utils";

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case "OWNER":
      return "default";
    case "ADMIN":
      return "secondary";
    case "MEMBER":
      return "outline";
    case "VIEWER":
      return "outline";
    default:
      return "outline";
  }
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
  const [editingWorkspace, setEditingWorkspace] =
    useState<WorkspaceWithRole | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workspaceToDelete, setWorkspaceToDelete] =
    useState<WorkspaceWithRole | null>(null);

  // State for auto-generating slugs
  const [createName, setCreateName] = useState("");
  const [createSlug, setCreateSlug] = useState("");
  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");

  // Auto-generate create slug when name changes
  const handleCreateNameChange = (name: string) => {
    setCreateName(name);
    setCreateSlug(generateSlug(name));
  };

  // Auto-generate edit slug when name changes
  const handleEditNameChange = (name: string) => {
    setEditName(name);
    setEditSlug(generateSlug(name));
  };

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
      // Reset form state
      setCreateName("");
      setCreateSlug("");
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
        data: {
          name,
          slug,
          description,
        },
      });

      toast.success("Workspace updated successfully!");
      setIsEditDialogOpen(false);
      setEditingWorkspace(null);
      // Reset form state
      setEditName("");
      setEditSlug("");
    } catch (error) {
      toast.error("Failed to update workspace. Please try again.");
      console.error("Error updating workspace:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!workspaceToDelete) return;

    try {
      await deleteWorkspace(workspaceToDelete.id);
      toast.success("Workspace deleted successfully!");
      setDeleteDialogOpen(false);
      setWorkspaceToDelete(null);
    } catch (error) {
      toast.error("Failed to delete workspace. Please try again.");
      console.error("Error deleting workspace:", error);
    }
  };

  const openEditDialog = (workspace: WorkspaceWithRole) => {
    setEditingWorkspace(workspace);
    setEditName(workspace.name);
    setEditSlug(workspace.slug);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (workspace: WorkspaceWithRole) => {
    setWorkspaceToDelete(workspace);
    setDeleteDialogOpen(true);
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
            Manage your workspaces and collaborate with your team
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
                    value={createName}
                    onChange={(e) => handleCreateNameChange(e.target.value)}
                    placeholder="Enter workspace name"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Workspace Slug</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={createSlug}
                    onChange={(e) => setCreateSlug(e.target.value)}
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
          {workspaces.map((workspace) => (
            <Card key={workspace.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">
                        {workspace.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        /{workspace.slug}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={getRoleBadgeVariant(workspace.userRole.role)}
                    >
                      {workspace.userRole.role}
                    </Badge>
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
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {workspace.userRole.role === "OWNER" && (
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(workspace)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="mb-4">
                  {workspace.description || "No description provided"}
                </CardDescription>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Team workspace</span>
                  </div>
                  <span>
                    Created {new Date(workspace.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No workspaces yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first workspace to get started with organizing your
            projects.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </Button>
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
                  value={editName}
                  onChange={(e) => handleEditNameChange(e.target.value)}
                  placeholder="Enter workspace name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-slug">Workspace Slug</Label>
                <Input
                  id="edit-slug"
                  name="slug"
                  value={editSlug}
                  onChange={(e) => setEditSlug(e.target.value)}
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
                onClick={() => setIsEditDialogOpen(false)}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              workspace "{workspaceToDelete?.name}" and all associated projects
              and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWorkspace}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
