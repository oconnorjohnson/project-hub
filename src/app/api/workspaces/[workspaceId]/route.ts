import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { workspaces, userWorkspaceRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const updateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  description: z.string().optional(),
});

// Helper function to check workspace access
async function checkWorkspaceAccess(
  workspaceId: string,
  userId: string,
  requiredRole?: string[]
) {
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

  if (userRole.length === 0) {
    return null;
  }

  if (requiredRole && !requiredRole.includes(userRole[0].role)) {
    return null;
  }

  return userRole[0];
}

// GET /api/workspaces/[workspaceId] - Get single workspace
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Check access
    const userRole = await checkWorkspaceAccess(workspaceId, userId);
    if (!userRole) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Get workspace details
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        ...workspace,
        userRole,
      },
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error fetching workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH /api/workspaces/[workspaceId] - Update workspace
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Check access (only OWNER and ADMIN can update)
    const userRole = await checkWorkspaceAccess(workspaceId, userId, [
      "OWNER",
      "ADMIN",
    ]);
    if (!userRole) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = updateWorkspaceSchema.parse(body);

    // If slug is being updated, check if it's already taken
    if (validatedData.slug) {
      const existingWorkspace = await db
        .select()
        .from(workspaces)
        .where(
          and(
            eq(workspaces.slug, validatedData.slug),
            eq(workspaces.id, workspaceId)
          )
        )
        .limit(1);

      if (
        existingWorkspace.length > 0 &&
        existingWorkspace[0].id !== workspaceId
      ) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    // Update workspace
    const [updatedWorkspace] = await db
      .update(workspaces)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(workspaces.id, workspaceId))
      .returning();

    return NextResponse.json({
      data: updatedWorkspace,
      success: true,
      message: "Workspace updated successfully",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/workspaces/[workspaceId] - Delete workspace
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    // Check access (only OWNER can delete)
    const userRole = await checkWorkspaceAccess(workspaceId, userId, ["OWNER"]);
    if (!userRole) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Delete workspace (cascade will handle related records)
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
