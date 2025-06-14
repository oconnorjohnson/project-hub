import {
  pgTable,
  text,
  timestamp,
  uuid,
  pgEnum,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const artifactTypeEnum = pgEnum("artifact_type", [
  "TASK",
  "DOC",
  "ASSET",
  "EVENT",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "DONE",
  "CANCELLED",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
]);

export const eventTypeEnum = pgEnum("event_type", [
  "MEETING",
  "DEADLINE",
  "MILESTONE",
  "REMINDER",
  "BLOCK", // Time blocking
]);

export const userRoleEnum = pgEnum("user_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

// New enums for workspace references
export const workspaceReferenceTypeEnum = pgEnum("workspace_reference_type", [
  "DEPENDENCY",
  "COLLABORATION",
  "PARENT_CHILD",
]);

export const projectReferenceTypeEnum = pgEnum("project_reference_type", [
  "DEPENDENCY",
  "BLOCKS",
  "RELATED",
  "SUBTASK",
]);

export const accessLevelEnum = pgEnum("access_level", [
  "read",
  "reference",
  "collaborate",
]);

// Users table (synced from Clerk via webhook)
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  email: text("email").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workspaces table
export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User workspace roles junction table
export const userWorkspaceRoles = pgTable("user_workspace_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  tags: jsonb("tags").$type<string[]>().default([]),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Artifacts table (tasks, docs, assets, events)
export const artifacts = pgTable("artifacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  type: artifactTypeEnum("type").notNull(),
  title: text("title").notNull(),
  content: jsonb("content"), // Flexible content storage (task details, doc content, etc.)
  metadata: jsonb("metadata"), // Type-specific metadata
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Workspace References table
export const workspaceReferences = pgTable("workspace_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceWorkspaceId: uuid("source_workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  targetWorkspaceId: uuid("target_workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  referenceType: workspaceReferenceTypeEnum("reference_type").notNull(),
  description: text("description"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project References table
export const projectReferences = pgTable("project_references", {
  id: uuid("id").defaultRandom().primaryKey(),
  sourceProjectId: uuid("source_project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  targetProjectId: uuid("target_project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  referenceType: projectReferenceTypeEnum("reference_type").notNull(),
  description: text("description"),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Cross-Workspace Permissions table
export const crossWorkspacePermissions = pgTable(
  "cross_workspace_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    grantedByWorkspaceId: uuid("granted_by_workspace_id")
      .notNull()
      .references(() => workspaces.id, { onDelete: "cascade" }),
    accessLevel: accessLevelEnum("access_level").notNull(),
    grantedBy: text("granted_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
  }
);

// Documents table for notes system
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  content: jsonb("content").notNull().default({}), // TipTap JSON content
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Document locks table for edit session management
export const documentLocks = pgTable("document_locks", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  lockedBy: text("locked_by").notNull(), // Session ID or user identifier
  lockedAt: timestamp("locked_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});

// Document versions table for version history
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").defaultRandom().primaryKey(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  content: jsonb("content").notNull(),
  versionNumber: text("version_number").notNull(), // Using text for semantic versioning
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaceRoles: many(userWorkspaceRoles),
  createdArtifacts: many(artifacts),
  createdDocuments: many(documents),
  createdDocumentVersions: many(documentVersions),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  userRoles: many(userWorkspaceRoles),
  projects: many(projects),
  outgoingReferences: many(workspaceReferences, {
    relationName: "sourceWorkspace",
  }),
  incomingReferences: many(workspaceReferences, {
    relationName: "targetWorkspace",
  }),
  grantedPermissions: many(crossWorkspacePermissions, {
    relationName: "grantingWorkspace",
  }),
  receivedPermissions: many(crossWorkspacePermissions, {
    relationName: "receivingWorkspace",
  }),
}));

export const userWorkspaceRolesRelations = relations(
  userWorkspaceRoles,
  ({ one }) => ({
    user: one(users, {
      fields: [userWorkspaceRoles.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [userWorkspaceRoles.workspaceId],
      references: [workspaces.id],
    }),
  })
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  workspace: one(workspaces, {
    fields: [projects.workspaceId],
    references: [workspaces.id],
  }),
  artifacts: many(artifacts),
  documents: many(documents),
  outgoingReferences: many(projectReferences, {
    relationName: "sourceProject",
  }),
  incomingReferences: many(projectReferences, {
    relationName: "targetProject",
  }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  project: one(projects, {
    fields: [artifacts.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [artifacts.createdBy],
    references: [users.id],
  }),
}));

// New relations for reference tables
export const workspaceReferencesRelations = relations(
  workspaceReferences,
  ({ one }) => ({
    sourceWorkspace: one(workspaces, {
      fields: [workspaceReferences.sourceWorkspaceId],
      references: [workspaces.id],
      relationName: "sourceWorkspace",
    }),
    targetWorkspace: one(workspaces, {
      fields: [workspaceReferences.targetWorkspaceId],
      references: [workspaces.id],
      relationName: "targetWorkspace",
    }),
    createdByUser: one(users, {
      fields: [workspaceReferences.createdBy],
      references: [users.id],
    }),
  })
);

export const projectReferencesRelations = relations(
  projectReferences,
  ({ one }) => ({
    sourceProject: one(projects, {
      fields: [projectReferences.sourceProjectId],
      references: [projects.id],
      relationName: "sourceProject",
    }),
    targetProject: one(projects, {
      fields: [projectReferences.targetProjectId],
      references: [projects.id],
      relationName: "targetProject",
    }),
    createdByUser: one(users, {
      fields: [projectReferences.createdBy],
      references: [users.id],
    }),
  })
);

export const crossWorkspacePermissionsRelations = relations(
  crossWorkspacePermissions,
  ({ one }) => ({
    user: one(users, {
      fields: [crossWorkspacePermissions.userId],
      references: [users.id],
    }),
    workspace: one(workspaces, {
      fields: [crossWorkspacePermissions.workspaceId],
      references: [workspaces.id],
      relationName: "receivingWorkspace",
    }),
    grantedByWorkspace: one(workspaces, {
      fields: [crossWorkspacePermissions.grantedByWorkspaceId],
      references: [workspaces.id],
      relationName: "grantingWorkspace",
    }),
    grantedByUser: one(users, {
      fields: [crossWorkspacePermissions.grantedBy],
      references: [users.id],
    }),
  })
);

// Document relations
export const documentsRelations = relations(documents, ({ one, many }) => ({
  project: one(projects, {
    fields: [documents.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  locks: many(documentLocks),
  versions: many(documentVersions),
}));

export const documentLocksRelations = relations(documentLocks, ({ one }) => ({
  document: one(documents, {
    fields: [documentLocks.documentId],
    references: [documents.id],
  }),
}));

export const documentVersionsRelations = relations(
  documentVersions,
  ({ one }) => ({
    document: one(documents, {
      fields: [documentVersions.documentId],
      references: [documents.id],
    }),
    createdBy: one(users, {
      fields: [documentVersions.createdBy],
      references: [users.id],
    }),
  })
);
