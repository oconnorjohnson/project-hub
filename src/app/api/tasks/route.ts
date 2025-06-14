import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  artifacts,
  projects,
  workspaces,
  userWorkspaceRoles,
  users,
} from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { z } from "zod";

const createTaskSchema = z.object({
  projectId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z
    .object({
      description: z.string().optional(),
      checklist: z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
            completed: z.boolean(),
          })
        )
        .optional(),
      attachments: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            url: z.string(),
            type: z.string(),
          })
        )
        .optional(),
    })
    .optional(),
  metadata: z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    dueDate: z.string().optional(),
    estimatedHours: z.number().optional(),
    actualHours: z.number().optional(),
    assignedTo: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    parentTaskId: z.string().uuid().optional(),
    position: z.number().optional(),
  }),
});

// Helper function to check task access (for future use)
/*
async function checkTaskAccess(taskId: string, userId: string) {
  const task = await db
    .select({
      task: artifacts,
      project: projects,
      workspace: workspaces,
      userRole: userWorkspaceRoles.role,
    })
    .from(artifacts)
    .leftJoin(projects, eq(artifacts.projectId, projects.id))
    .leftJoin(workspaces, eq(projects.workspaceId, workspaces.id))
    .leftJoin(
      userWorkspaceRoles,
      and(
        eq(userWorkspaceRoles.workspaceId, workspaces.id),
        eq(userWorkspaceRoles.userId, userId)
      )
    )
    .where(and(eq(artifacts.id, taskId), eq(artifacts.type, "TASK")))
    .limit(1);

  if (task.length === 0) {
    return null;
  }

  const { task: taskData, project, workspace, userRole } = task[0];

  // If it's a global task (no project), user must be the creator
  if (!project) {
    return taskData.createdBy === userId
      ? { task: taskData, project: null, workspace: null, userRole: null }
      : null;
  }

  // If it's a project task, user must have access to the workspace
  if (!userRole) {
    return null;
  }

  return { task: taskData, project, workspace, userRole };
}
*/

// GET /api/tasks - Get tasks with filtering
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    const global = searchParams.get("global") === "true";

    let tasks;

    if (global) {
      // Get global tasks created by the user
      tasks = await db
        .select({
          id: artifacts.id,
          projectId: artifacts.projectId,
          type: artifacts.type,
          title: artifacts.title,
          content: artifacts.content,
          metadata: artifacts.metadata,
          createdBy: artifacts.createdBy,
          createdAt: artifacts.createdAt,
          updatedAt: artifacts.updatedAt,
          project: projects,
          workspace: workspaces,
          createdByUser: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            imageUrl: users.imageUrl,
          },
        })
        .from(artifacts)
        .leftJoin(projects, eq(artifacts.projectId, projects.id))
        .leftJoin(workspaces, eq(projects.workspaceId, workspaces.id))
        .leftJoin(users, eq(artifacts.createdBy, users.id))
        .where(
          and(
            eq(artifacts.type, "TASK"),
            isNull(artifacts.projectId),
            eq(artifacts.createdBy, userId)
          )
        )
        .orderBy(desc(artifacts.createdAt));
    } else if (projectId) {
      // Get tasks for a specific project
      tasks = await db
        .select({
          id: artifacts.id,
          projectId: artifacts.projectId,
          type: artifacts.type,
          title: artifacts.title,
          content: artifacts.content,
          metadata: artifacts.metadata,
          createdBy: artifacts.createdBy,
          createdAt: artifacts.createdAt,
          updatedAt: artifacts.updatedAt,
          project: projects,
          workspace: workspaces,
          createdByUser: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            imageUrl: users.imageUrl,
          },
        })
        .from(artifacts)
        .leftJoin(projects, eq(artifacts.projectId, projects.id))
        .leftJoin(workspaces, eq(projects.workspaceId, workspaces.id))
        .leftJoin(users, eq(artifacts.createdBy, users.id))
        .where(
          and(eq(artifacts.type, "TASK"), eq(artifacts.projectId, projectId))
        )
        .orderBy(desc(artifacts.createdAt));
    } else {
      // Get all accessible tasks (simplified - just user's global tasks for now)
      tasks = await db
        .select({
          id: artifacts.id,
          projectId: artifacts.projectId,
          type: artifacts.type,
          title: artifacts.title,
          content: artifacts.content,
          metadata: artifacts.metadata,
          createdBy: artifacts.createdBy,
          createdAt: artifacts.createdAt,
          updatedAt: artifacts.updatedAt,
          project: projects,
          workspace: workspaces,
          createdByUser: {
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            imageUrl: users.imageUrl,
          },
        })
        .from(artifacts)
        .leftJoin(projects, eq(artifacts.projectId, projects.id))
        .leftJoin(workspaces, eq(projects.workspaceId, workspaces.id))
        .leftJoin(users, eq(artifacts.createdBy, users.id))
        .where(and(eq(artifacts.type, "TASK"), eq(artifacts.createdBy, userId)))
        .orderBy(desc(artifacts.createdAt));
    }

    return NextResponse.json({
      data: tasks,
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create new task
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createTaskSchema.parse(body);

    // If projectId is provided, check access to the project
    if (validatedData.projectId) {
      const projectAccess = await db
        .select({
          project: projects,
          userRole: userWorkspaceRoles.role,
        })
        .from(projects)
        .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
        .innerJoin(
          userWorkspaceRoles,
          eq(workspaces.id, userWorkspaceRoles.workspaceId)
        )
        .where(
          and(
            eq(projects.id, validatedData.projectId),
            eq(userWorkspaceRoles.userId, userId)
          )
        )
        .limit(1);

      if (projectAccess.length === 0) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }

      // Check if user has permission to create tasks (MEMBER and above)
      const { userRole } = projectAccess[0];
      if (!["OWNER", "ADMIN", "MEMBER"].includes(userRole)) {
        return NextResponse.json(
          { error: "Insufficient permissions to create tasks" },
          { status: 403 }
        );
      }
    }

    // Create the task
    const [newTask] = await db
      .insert(artifacts)
      .values({
        projectId: validatedData.projectId || null,
        type: "TASK",
        title: validatedData.title,
        content: validatedData.content || {},
        metadata: validatedData.metadata,
        createdBy: userId,
      })
      .returning();

    // Fetch the complete task with relations
    const completeTask = await db
      .select({
        id: artifacts.id,
        projectId: artifacts.projectId,
        type: artifacts.type,
        title: artifacts.title,
        content: artifacts.content,
        metadata: artifacts.metadata,
        createdBy: artifacts.createdBy,
        createdAt: artifacts.createdAt,
        updatedAt: artifacts.updatedAt,
        project: projects,
        workspace: workspaces,
        createdByUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          imageUrl: users.imageUrl,
        },
      })
      .from(artifacts)
      .leftJoin(projects, eq(artifacts.projectId, projects.id))
      .leftJoin(workspaces, eq(projects.workspaceId, workspaces.id))
      .leftJoin(users, eq(artifacts.createdBy, users.id))
      .where(eq(artifacts.id, newTask.id))
      .limit(1);

    return NextResponse.json({
      data: completeTask[0],
      success: true,
      message: "Task created successfully",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
