import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, workspaces, userWorkspaceRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  workspaceId: z.string().uuid("Invalid workspace ID"),
});

// Helper function to check workspace access
async function checkWorkspaceAccess(workspaceId: string, userId: string) {
  const userRole = await db
    .select()
    .from(userWorkspaceRoles)
    .where(
      and(
        eq(userWorkspaceRoles.workspaceId, workspaceId),
        eq(userWorkspaceRoles.userId, userId)
      )
    )
    .limit(1);

  return userRole.length > 0 ? userRole[0] : null;
}

// GET /api/projects - Get all projects for current user
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get("workspaceId");

    const whereConditions = [eq(userWorkspaceRoles.userId, userId)];

    // Filter by workspace if specified
    if (workspaceId) {
      whereConditions.push(eq(projects.workspaceId, workspaceId));
    }

    const userProjects = await db
      .select({
        id: projects.id,
        workspaceId: projects.workspaceId,
        name: projects.name,
        slug: projects.slug,
        description: projects.description,
        tags: projects.tags,
        isArchived: projects.isArchived,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        workspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(projects)
      .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
      .innerJoin(
        userWorkspaceRoles,
        eq(workspaces.id, userWorkspaceRoles.workspaceId)
      )
      .where(and(...whereConditions));

    return NextResponse.json({
      data: userProjects,
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create new project
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createProjectSchema.parse(body);

    // Check workspace access
    const userRole = await checkWorkspaceAccess(
      validatedData.workspaceId,
      userId
    );
    if (!userRole) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if slug is already taken within the workspace
    const existingProject = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.slug, validatedData.slug),
          eq(projects.workspaceId, validatedData.workspaceId)
        )
      )
      .limit(1);

    if (existingProject.length > 0) {
      return NextResponse.json(
        { error: "Project slug already exists in this workspace" },
        { status: 400 }
      );
    }

    // Create project
    const [newProject] = await db
      .insert(projects)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
        tags: validatedData.tags,
        workspaceId: validatedData.workspaceId,
      })
      .returning();

    return NextResponse.json({
      data: newProject,
      success: true,
      message: "Project created successfully",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
