"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  ExternalLink,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Tag,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/hooks/use-projects";
import { useProjectReferences } from "@/hooks/use-project-references";
import { useCreateProjectReference } from "@/hooks/use-project-references";
import { ReferencePicker } from "@/components/references/reference-picker";
import { toast } from "sonner";
import {
  ProjectReferenceType,
  WorkspaceReferenceType,
  Project,
  Workspace,
} from "@/lib/types";

const getReferenceTypeColor = (type: ProjectReferenceType) => {
  switch (type) {
    case "DEPENDENCY":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "BLOCKS":
      return "bg-red-100 text-red-800 border-red-200";
    case "RELATED":
      return "bg-green-100 text-green-800 border-green-200";
    case "SUBTASK":
      return "bg-purple-100 text-purple-800 border-purple-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

const getReferenceTypeIcon = (type: ProjectReferenceType) => {
  switch (type) {
    case "DEPENDENCY":
      return "🔗";
    case "BLOCKS":
      return "🚫";
    case "RELATED":
      return "🔄";
    case "SUBTASK":
      return "📋";
    default:
      return "📎";
  }
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: references, isLoading: referencesLoading } =
    useProjectReferences(projectId);
  const { mutateAsync: createReference } = useCreateProjectReference(projectId);

  const [isCreatingReference, setIsCreatingReference] = useState(false);

  const handleCreateReference = async (
    reference: Project | Workspace,
    referenceType: ProjectReferenceType | WorkspaceReferenceType
  ) => {
    // Only handle project references on this page
    if (
      "workspaceId" in reference &&
      typeof referenceType === "string" &&
      ["DEPENDENCY", "BLOCKS", "RELATED", "SUBTASK"].includes(referenceType)
    ) {
      setIsCreatingReference(true);
      try {
        await createReference({
          targetProjectId: reference.id,
          referenceType: referenceType as ProjectReferenceType,
          description: `${referenceType.toLowerCase()} relationship with ${
            reference.name
          }`,
        });
        toast.success("Project reference created successfully!");
      } catch (error) {
        toast.error("Failed to create project reference");
        console.error("Error creating reference:", error);
      } finally {
        setIsCreatingReference(false);
      }
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <FolderOpen className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Project not found</h2>
        <p className="text-muted-foreground">
          The project you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access to it.
        </p>
        <Button onClick={() => router.push("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/projects")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {project.workspace.name}
          </span>
        </div>
      </div>

      {/* Project Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">/{project.slug}</p>
            </div>
          </div>
          {project.description && (
            <p className="text-lg text-muted-foreground max-w-2xl">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Created {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            {project.tags && project.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                <div className="flex gap-1">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ReferencePicker
            type="project"
            onSelect={handleCreateReference}
            excludeIds={[projectId]}
            disabled={isCreatingReference}
            trigger={
              <Button variant="outline" disabled={isCreatingReference}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Add Reference
              </Button>
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="references">
            References
            {references &&
              references.outgoing.length + references.incoming.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {references.outgoing.length + references.incoming.length}
                </Badge>
              )}
          </TabsTrigger>
          <TabsTrigger value="artifacts">Artifacts</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Project Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={project.isArchived ? "secondary" : "default"}>
                    {project.isArchived ? "Archived" : "Active"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Workspace
                  </span>
                  <span className="text-sm font-medium">
                    {project.workspace.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span className="text-sm">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Last Updated
                  </span>
                  <span className="text-sm">
                    {new Date(project.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Manage Team
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  No recent activity
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="references" className="space-y-6">
          {referencesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Outgoing References */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ExternalLink className="h-5 w-5" />
                    Outgoing References
                    <Badge variant="secondary">
                      {references?.outgoing.length || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Projects that this project references
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {references?.outgoing.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No outgoing references yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {references?.outgoing.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {getReferenceTypeIcon(ref.referenceType)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">
                                  {ref.targetProject?.name}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={getReferenceTypeColor(
                                    ref.referenceType
                                  )}
                                >
                                  {ref.referenceType}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                in {ref.targetWorkspace?.name}
                              </p>
                              {ref.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ref.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/projects/${ref.targetProjectId}`)
                            }
                          >
                            View Project
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Incoming References */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ArrowLeft className="h-5 w-5" />
                    Incoming References
                    <Badge variant="secondary">
                      {references?.incoming.length || 0}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Projects that reference this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {references?.incoming.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No incoming references yet
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {references?.incoming.map((ref) => (
                        <div
                          key={ref.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">
                              {getReferenceTypeIcon(ref.referenceType)}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">
                                  {ref.sourceProject?.name}
                                </h4>
                                <Badge
                                  variant="outline"
                                  className={getReferenceTypeColor(
                                    ref.referenceType
                                  )}
                                >
                                  {ref.referenceType}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                in {ref.sourceWorkspace?.name}
                              </p>
                              {ref.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ref.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/projects/${ref.sourceProjectId}`)
                            }
                          >
                            View Project
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="artifacts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Artifacts</CardTitle>
              <CardDescription>
                Tasks, documents, assets, and events for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Artifact management coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
              <CardDescription>
                Recent changes and updates to this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Activity feed coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
