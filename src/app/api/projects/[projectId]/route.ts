import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { projects, workspaces, userWorkspaceRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isArchived: z.boolean().optional(),
});

// Helper function to check project access
async function checkProjectAccess(
  projectId: string,
  userId: string,
  requiredRole?: string[]
) {
  const projectWithRole = await db
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
      and(eq(projects.id, projectId), eq(userWorkspaceRoles.userId, userId))
    )
    .limit(1);

  if (projectWithRole.length === 0) {
    return null;
  }

  const { project, userRole } = projectWithRole[0];

  if (requiredRole && !requiredRole.includes(userRole)) {
    return null;
  }

  return { project, userRole };
}

// GET /api/projects/[projectId] - Get single project
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check access
    const result = await checkProjectAccess(projectId, userId);
    if (!result) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { project, userRole } = result;

    return NextResponse.json({
      data: {
        ...project,
        userRole,
      },
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[projectId] - Update project
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check access (MEMBER and above can update)
    const result = await checkProjectAccess(projectId, userId, [
      "OWNER",
      "ADMIN",
      "MEMBER",
    ]);
    if (!result) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { project } = result;
    const body = await req.json();
    const validatedData = updateProjectSchema.parse(body);

    // If slug is being updated, check if it's already taken in the workspace
    if (validatedData.slug) {
      const existingProject = await db
        .select()
        .from(projects)
        .where(
          and(
            eq(projects.slug, validatedData.slug),
            eq(projects.workspaceId, project.workspaceId)
          )
        )
        .limit(1);

      if (existingProject.length > 0 && existingProject[0].id !== projectId) {
        return NextResponse.json(
          { error: "Project slug already exists in this workspace" },
          { status: 400 }
        );
      }
    }

    // Update project
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({
      data: updatedProject,
      success: true,
      message: "Project updated successfully",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[projectId] - Delete project
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await params;

    // Check access (ADMIN and OWNER can delete)
    const result = await checkProjectAccess(projectId, userId, [
      "OWNER",
      "ADMIN",
    ]);
    if (!result) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Delete project (cascade will handle related records)
    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
