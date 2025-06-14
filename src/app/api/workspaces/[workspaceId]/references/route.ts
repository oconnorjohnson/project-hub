import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  workspaceReferences,
  workspaces,
  userWorkspaceRoles,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createWorkspaceReferenceSchema = z.object({
  targetWorkspaceId: z.string().uuid("Invalid target workspace ID"),
  referenceType: z.enum(["DEPENDENCY", "COLLABORATION", "PARENT_CHILD"]),
  description: z.string().optional(),
});

// Helper function to check workspace access and role
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

  const role = userRole[0].role;
  if (requiredRole && !requiredRole.includes(role)) {
    return null;
  }

  return role;
}

// GET /api/workspaces/[workspaceId]/references - Get workspace references
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

    // Check workspace access
    const userRole = await checkWorkspaceAccess(workspaceId, userId);
    if (!userRole) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    // Get outgoing references (references this workspace makes to others)
    const outgoingReferences = await db
      .select({
        id: workspaceReferences.id,
        sourceWorkspaceId: workspaceReferences.sourceWorkspaceId,
        targetWorkspaceId: workspaceReferences.targetWorkspaceId,
        referenceType: workspaceReferences.referenceType,
        description: workspaceReferences.description,
        createdBy: workspaceReferences.createdBy,
        createdAt: workspaceReferences.createdAt,
        updatedAt: workspaceReferences.updatedAt,
        targetWorkspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          description: workspaces.description,
        },
        createdByUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(workspaceReferences)
      .innerJoin(
        workspaces,
        eq(workspaceReferences.targetWorkspaceId, workspaces.id)
      )
      .innerJoin(users, eq(workspaceReferences.createdBy, users.id))
      .where(eq(workspaceReferences.sourceWorkspaceId, workspaceId));

    // Get incoming references (references other workspaces make to this one)
    const incomingReferences = await db
      .select({
        id: workspaceReferences.id,
        sourceWorkspaceId: workspaceReferences.sourceWorkspaceId,
        targetWorkspaceId: workspaceReferences.targetWorkspaceId,
        referenceType: workspaceReferences.referenceType,
        description: workspaceReferences.description,
        createdBy: workspaceReferences.createdBy,
        createdAt: workspaceReferences.createdAt,
        updatedAt: workspaceReferences.updatedAt,
        sourceWorkspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          description: workspaces.description,
        },
        createdByUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(workspaceReferences)
      .innerJoin(
        workspaces,
        eq(workspaceReferences.sourceWorkspaceId, workspaces.id)
      )
      .innerJoin(users, eq(workspaceReferences.createdBy, users.id))
      .where(eq(workspaceReferences.targetWorkspaceId, workspaceId));

    return NextResponse.json({
      data: {
        outgoing: outgoingReferences,
        incoming: incomingReferences,
      },
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error fetching workspace references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/workspaces/[workspaceId]/references - Create workspace reference
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;
    const body = await req.json();
    const validatedData = createWorkspaceReferenceSchema.parse(body);

    // Check source workspace access (need ADMIN+ role to create references)
    const userRole = await checkWorkspaceAccess(workspaceId, userId, [
      "OWNER",
      "ADMIN",
    ]);
    if (!userRole) {
      return NextResponse.json(
        { error: "Insufficient permissions to create workspace reference" },
        { status: 403 }
      );
    }

    // Prevent self-reference
    if (workspaceId === validatedData.targetWorkspaceId) {
      return NextResponse.json(
        { error: "Cannot create reference to the same workspace" },
        { status: 400 }
      );
    }

    // Check if target workspace exists and user has access to it
    const targetWorkspaceAccess = await checkWorkspaceAccess(
      validatedData.targetWorkspaceId,
      userId
    );
    if (!targetWorkspaceAccess) {
      return NextResponse.json(
        { error: "Target workspace not found or access denied" },
        { status: 404 }
      );
    }

    // Check if reference already exists
    const existingReference = await db
      .select()
      .from(workspaceReferences)
      .where(
        and(
          eq(workspaceReferences.sourceWorkspaceId, workspaceId),
          eq(
            workspaceReferences.targetWorkspaceId,
            validatedData.targetWorkspaceId
          ),
          eq(workspaceReferences.referenceType, validatedData.referenceType)
        )
      )
      .limit(1);

    if (existingReference.length > 0) {
      return NextResponse.json(
        { error: "Reference already exists" },
        { status: 400 }
      );
    }

    // Create the reference
    const [newReference] = await db
      .insert(workspaceReferences)
      .values({
        sourceWorkspaceId: workspaceId,
        targetWorkspaceId: validatedData.targetWorkspaceId,
        referenceType: validatedData.referenceType,
        description: validatedData.description,
        createdBy: userId,
      })
      .returning();

    // Fetch the complete reference with related data
    const completeReference = await db
      .select({
        id: workspaceReferences.id,
        sourceWorkspaceId: workspaceReferences.sourceWorkspaceId,
        targetWorkspaceId: workspaceReferences.targetWorkspaceId,
        referenceType: workspaceReferences.referenceType,
        description: workspaceReferences.description,
        createdBy: workspaceReferences.createdBy,
        createdAt: workspaceReferences.createdAt,
        updatedAt: workspaceReferences.updatedAt,
        targetWorkspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          description: workspaces.description,
        },
      })
      .from(workspaceReferences)
      .innerJoin(
        workspaces,
        eq(workspaceReferences.targetWorkspaceId, workspaces.id)
      )
      .where(eq(workspaceReferences.id, newReference.id))
      .limit(1);

    return NextResponse.json({
      data: completeReference[0],
      success: true,
      message: "Workspace reference created successfully",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating workspace reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
