import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { workspaces, userWorkspaceRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
});

// GET /api/workspaces - Get all workspaces for current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get workspaces with user roles
    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        description: workspaces.description,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        userRole: {
          id: userWorkspaceRoles.id,
          role: userWorkspaceRoles.role,
          createdAt: userWorkspaceRoles.createdAt,
        },
      })
      .from(workspaces)
      .innerJoin(
        userWorkspaceRoles,
        eq(workspaces.id, userWorkspaceRoles.workspaceId)
      )
      .where(eq(userWorkspaceRoles.userId, userId));

    return NextResponse.json({
      data: userWorkspaces,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching workspaces:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces - Create new workspace
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = createWorkspaceSchema.parse(body);

    // Check if slug is already taken
    const existingWorkspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.slug, validatedData.slug))
      .limit(1);

    if (existingWorkspace.length > 0) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    // Create workspace
    const [newWorkspace] = await db
      .insert(workspaces)
      .values({
        name: validatedData.name,
        slug: validatedData.slug,
        description: validatedData.description,
      })
      .returning();

    // Add user as owner
    await db.insert(userWorkspaceRoles).values({
      userId,
      workspaceId: newWorkspace.id,
      role: "OWNER",
    });

    return NextResponse.json({
      data: newWorkspace,
      success: true,
      message: "Workspace created successfully",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating workspace:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
