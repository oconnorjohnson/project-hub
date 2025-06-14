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
  projectId: string | null; // null for global items
  type: "TASK" | "DOC" | "ASSET" | "EVENT";
  title: string;
  content: Record<string, unknown>; // JSONB content
  metadata: Record<string, unknown>; // JSONB metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Task and Calendar specific types
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE"
  | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
export type EventType =
  | "MEETING"
  | "DEADLINE"
  | "MILESTONE"
  | "REMINDER"
  | "BLOCK";

// Task content structure
export interface TaskContent {
  description?: string;
  checklist?: Array<{
    id: string;
    text: string;
    completed: boolean;
  }>;
  attachments?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
}

// Task metadata structure
export interface TaskMetadata {
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO date string
  estimatedHours?: number;
  actualHours?: number;
  assignedTo?: string[]; // User IDs
  tags?: string[];
  parentTaskId?: string; // For subtasks
  position?: number; // For kanban ordering
}

// Event content structure
export interface EventContent {
  description?: string;
  location?: string;
  meetingUrl?: string;
  agenda?: string[];
  attendees?: Array<{
    userId: string;
    status: "invited" | "accepted" | "declined" | "tentative";
  }>;
}

// Event metadata structure
export interface EventMetadata {
  eventType: EventType;
  startDate: string; // ISO datetime string
  endDate?: string; // ISO datetime string
  isAllDay: boolean;
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number; // Every N days/weeks/months/years
    endDate?: string;
    daysOfWeek?: number[]; // 0-6, Sunday = 0
  };
  reminders?: Array<{
    type: "email" | "notification";
    minutesBefore: number;
  }>;
  color?: string; // Hex color for calendar display
}

// Typed artifact interfaces
export interface Task extends Omit<Artifact, "type" | "content" | "metadata"> {
  type: "TASK";
  content: TaskContent;
  metadata: TaskMetadata;
}

export interface CalendarEvent
  extends Omit<Artifact, "type" | "content" | "metadata"> {
  type: "EVENT";
  content: EventContent;
  metadata: EventMetadata;
}

// Extended types with relations
export interface ProjectWithWorkspace extends Project {
  workspace: Workspace;
}

export interface WorkspaceWithRole extends Workspace {
  userRole: UserWorkspaceRole;
}

export interface ArtifactWithProject extends Artifact {
  project: Project | null; // null for global items
  createdByUser: User;
}

export interface TaskWithProject extends Task {
  project: Project | null;
  createdByUser: User;
}

export interface CalendarEventWithProject extends CalendarEvent {
  project: Project | null;
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
  projectId?: string; // Optional for global items
  type: "TASK" | "DOC" | "ASSET" | "EVENT";
  title: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface CreateTaskData {
  projectId?: string;
  title: string;
  content?: TaskContent;
  metadata: TaskMetadata;
}

export interface CreateCalendarEventData {
  projectId?: string;
  title: string;
  content?: EventContent;
  metadata: EventMetadata;
}

// New reference types
export type WorkspaceReferenceType =
  | "DEPENDENCY"
  | "COLLABORATION"
  | "PARENT_CHILD";
export type ProjectReferenceType =
  | "DEPENDENCY"
  | "BLOCKS"
  | "RELATED"
  | "SUBTASK";
export type AccessLevel = "read" | "reference" | "collaborate";

export interface WorkspaceReference {
  id: string;
  sourceWorkspaceId: string;
  targetWorkspaceId: string;
  referenceType: WorkspaceReferenceType;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectReference {
  id: string;
  sourceProjectId: string;
  targetProjectId: string;
  referenceType: ProjectReferenceType;
  description?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CrossWorkspacePermission {
  id: string;
  userId: string;
  workspaceId: string;
  grantedByWorkspaceId: string;
  accessLevel: AccessLevel;
  grantedBy: string;
  createdAt: Date;
  expiresAt?: Date;
}

// Extended types with references
export interface WorkspaceWithReferences extends Workspace {
  outgoingReferences: (WorkspaceReference & { targetWorkspace: Workspace })[];
  incomingReferences: (WorkspaceReference & { sourceWorkspace: Workspace })[];
}

export interface ProjectWithReferences extends Project {
  outgoingReferences: (ProjectReference & {
    targetProject: Project & { workspace: Workspace };
  })[];
  incomingReferences: (ProjectReference & {
    sourceProject: Project & { workspace: Workspace };
  })[];
}

// Create data types for references
export interface CreateWorkspaceReferenceData {
  targetWorkspaceId: string;
  referenceType: WorkspaceReferenceType;
  description?: string;
}

export interface CreateProjectReferenceData {
  targetProjectId: string;
  referenceType: ProjectReferenceType;
  description?: string;
}

export interface CreateCrossWorkspacePermissionData {
  userId: string;
  workspaceId: string;
  accessLevel: AccessLevel;
  expiresAt?: Date;
}
