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
export const userRoleEnum = pgEnum("user_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
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
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  workspaceRoles: many(userWorkspaceRoles),
  createdArtifacts: many(artifacts),
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
  userRoles: many(userWorkspaceRoles),
  projects: many(projects),
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
