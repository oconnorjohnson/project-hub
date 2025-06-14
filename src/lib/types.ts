// Database model types
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWorkspaceRole {
  id: string;
  userId: string;
  workspaceId: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  createdAt: Date;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  description: string | null;
  tags: string[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Artifact {
  id: string;
  projectId: string;
  type: "TASK" | "DOC" | "ASSET" | "EVENT";
  title: string;
  content: Record<string, unknown>; // JSONB content
  metadata: Record<string, unknown>; // JSONB metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Extended types with relations
export interface ProjectWithWorkspace extends Project {
  workspace: Workspace;
}

export interface WorkspaceWithRole extends Workspace {
  userRole: UserWorkspaceRole;
}

export interface ArtifactWithProject extends Artifact {
  project: Project;
  createdByUser: User;
}

// Form types
export interface CreateWorkspaceData {
  name: string;
  slug: string;
  description?: string;
}

export interface CreateProjectData {
  name: string;
  slug: string;
  description?: string;
  tags?: string[];
  workspaceId: string;
}

export interface CreateArtifactData {
  projectId: string;
  type: "TASK" | "DOC" | "ASSET" | "EVENT";
  title: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}
