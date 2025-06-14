# Workspace References Implementation Plan

## Overview

This document outlines the implementation plan for adding workspace-to-workspace references and cross-workspace project references to the Project Hub system. This feature will enable workspaces to reference each other and projects to reference projects in other workspaces, creating a more interconnected and collaborative environment.

## Current System Analysis

### Existing Database Schema

- **workspaces**: Basic workspace information with unique slugs
- **projects**: Projects belong to a single workspace via `workspace_id`
- **user_workspace_roles**: Users can have roles in multiple workspaces
- **artifacts**: Tasks, docs, assets, events belong to projects

### Current Limitations

- Projects are isolated within their workspaces
- No way to reference or depend on projects from other workspaces
- No workspace-level relationships or dependencies
- Limited cross-workspace collaboration capabilities

## Implementation Approach

### Phase 1: Database Schema Extensions

#### 1.1 Workspace References Table

```sql
CREATE TABLE workspace_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('DEPENDENCY', 'COLLABORATION', 'PARENT_CHILD')),
  description TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(source_workspace_id, target_workspace_id, reference_type)
);
```

#### 1.2 Project References Table

```sql
CREATE TABLE project_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  target_project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reference_type TEXT NOT NULL CHECK (reference_type IN ('DEPENDENCY', 'BLOCKS', 'RELATED', 'SUBTASK')),
  description TEXT,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(source_project_id, target_project_id, reference_type)
);
```

#### 1.3 Cross-Workspace Permissions Table

```sql
CREATE TABLE cross_workspace_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  granted_by_workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL CHECK (access_level IN ('READ', 'reference', 'collaborate')),
  granted_by TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP,
  UNIQUE(user_id, workspace_id, granted_by_workspace_id, access_level)
);
```

### Phase 2: TypeScript Types and Schema Updates

#### 2.1 Drizzle Schema Extensions

```typescript
// Reference type enums
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

// New tables
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
```

#### 2.2 TypeScript Interface Updates

```typescript
// New types
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
```

### Phase 3: API Endpoints

#### 3.1 Workspace References API

- `GET /api/workspaces/[id]/references` - Get workspace references
- `POST /api/workspaces/[id]/references` - Create workspace reference
- `DELETE /api/workspace-references/[id]` - Delete workspace reference
- `PATCH /api/workspace-references/[id]` - Update workspace reference

#### 3.2 Project References API

- `GET /api/projects/[id]/references` - Get project references
- `POST /api/projects/[id]/references` - Create project reference
- `DELETE /api/project-references/[id]` - Delete project reference
- `PATCH /api/project-references/[id]` - Update project reference

#### 3.3 Cross-Workspace Search API

- `GET /api/search/workspaces` - Search accessible workspaces
- `GET /api/search/projects` - Search accessible projects across workspaces

#### 3.4 Permissions API

- `GET /api/cross-workspace-permissions` - Get user's cross-workspace permissions
- `POST /api/cross-workspace-permissions` - Grant cross-workspace permission
- `DELETE /api/cross-workspace-permissions/[id]` - Revoke permission

### Phase 4: Permission System

#### 4.1 Access Control Logic

1. **Workspace Access**: Users need explicit permission to reference workspaces they're not members of
2. **Project Access**: Users can reference projects in workspaces they have access to
3. **Reference Creation**: Only workspace members with ADMIN+ role can create outgoing references
4. **Reference Acceptance**: Target workspace must accept incoming references (auto-accept for same user)

#### 4.2 Permission Levels

- **read**: Can view workspace/project details when referenced
- **reference**: Can create references to workspace/projects
- **collaborate**: Can participate in cross-workspace activities

### Phase 5: UI Components

#### 5.1 Reference Picker Component

```typescript
interface ReferencePickerProps {
  type: "workspace" | "project";
  onSelect: (reference: Workspace | Project) => void;
  excludeIds?: string[];
  referenceType: WorkspaceReferenceType | ProjectReferenceType;
}
```

#### 5.2 Reference Management Components

- Reference list with filtering and search
- Reference creation modal with type selection
- Reference visualization (dependency graph)
- Cross-workspace permissions management

#### 5.3 Enhanced Project/Workspace Views

- References section showing incoming/outgoing references
- Cross-workspace project timeline
- Dependency status indicators

### Phase 6: Implementation Steps

#### Step 1: Database Migration

1. Create migration file for new tables and enums
2. Add relations to existing schema
3. Run migration and update schema types

#### Step 2: Core API Development

1. Implement workspace references CRUD operations
2. Implement project references CRUD operations
3. Add permission checking middleware
4. Create search endpoints

#### Step 3: Frontend Components

1. Build reference picker component
2. Create reference management UI
3. Add references sections to workspace/project pages
4. Implement cross-workspace search

#### Step 4: Permission System

1. Implement access control logic
2. Add permission management UI
3. Create permission request/approval flow

#### Step 5: Testing & Polish

1. Unit tests for all new functionality
2. Integration tests for cross-workspace operations
3. UI/UX refinements
4. Performance optimization

## Benefits

### For Users

- **Better Organization**: Create logical relationships between related workspaces and projects
- **Improved Collaboration**: Work across workspace boundaries while maintaining security
- **Dependency Tracking**: Visualize and manage project dependencies across workspaces
- **Reduced Duplication**: Reference existing work instead of recreating it

### For Teams

- **Scalable Structure**: Organize large organizations with multiple interconnected workspaces
- **Flexible Permissions**: Grant specific access levels without full workspace membership
- **Cross-Team Visibility**: Enable collaboration while maintaining workspace autonomy
- **Audit Trail**: Track all cross-workspace relationships and permissions

## Security Considerations

1. **Permission Validation**: All cross-workspace operations require explicit permission checks
2. **Audit Logging**: Track all reference creation/deletion and permission changes
3. **Data Isolation**: Referenced data remains in source workspace with controlled access
4. **Expiring Permissions**: Support time-limited cross-workspace access
5. **Cascade Handling**: Proper cleanup when workspaces/projects are deleted

## Future Enhancements

1. **Reference Templates**: Pre-defined reference types for common use cases
2. **Bulk Operations**: Create multiple references at once
3. **Reference Analytics**: Track reference usage and impact
4. **Automated References**: AI-suggested references based on content similarity
5. **Reference Notifications**: Alerts when referenced projects change status
6. **Cross-Workspace Reporting**: Aggregate data across referenced workspaces

This implementation will transform the Project Hub from isolated workspaces into an interconnected ecosystem that supports complex organizational structures while maintaining security and user control.
