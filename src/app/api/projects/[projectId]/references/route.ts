import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  projectReferences,
  projects,
  workspaces,
  userWorkspaceRoles,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const createProjectReferenceSchema = z.object({
  targetProjectId: z.string().uuid("Invalid target project ID"),
  referenceType: z.enum(["DEPENDENCY", "BLOCKS", "RELATED", "SUBTASK"]),
  description: z.string().optional(),
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

// GET /api/projects/[projectId]/references - Get project references
export async function GET(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = params;

    // Check project access
    const projectAccess = await checkProjectAccess(projectId, userId);
    if (!projectAccess) {
      return NextResponse.json(
        { error: "Project not found or access denied" },
        { status: 404 }
      );
    }

    // Get outgoing references (references this project makes to others)
    const outgoingReferences = await db
      .select({
        id: projectReferences.id,
        sourceProjectId: projectReferences.sourceProjectId,
        targetProjectId: projectReferences.targetProjectId,
        referenceType: projectReferences.referenceType,
        description: projectReferences.description,
        createdBy: projectReferences.createdBy,
        createdAt: projectReferences.createdAt,
        updatedAt: projectReferences.updatedAt,
        targetProject: {
          id: projects.id,
          name: projects.name,
          slug: projects.slug,
          description: projects.description,
          workspaceId: projects.workspaceId,
        },
        targetWorkspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
        createdByUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(projectReferences)
      .innerJoin(projects, eq(projectReferences.targetProjectId, projects.id))
      .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
      .innerJoin(users, eq(projectReferences.createdBy, users.id))
      .where(eq(projectReferences.sourceProjectId, projectId));

    // Get incoming references (references other projects make to this one)
    const incomingReferences = await db
      .select({
        id: projectReferences.id,
        sourceProjectId: projectReferences.sourceProjectId,
        targetProjectId: projectReferences.targetProjectId,
        referenceType: projectReferences.referenceType,
        description: projectReferences.description,
        createdBy: projectReferences.createdBy,
        createdAt: projectReferences.createdAt,
        updatedAt: projectReferences.updatedAt,
        sourceProject: {
          id: projects.id,
          name: projects.name,
          slug: projects.slug,
          description: projects.description,
          workspaceId: projects.workspaceId,
        },
        sourceWorkspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
        createdByUser: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
        },
      })
      .from(projectReferences)
      .innerJoin(projects, eq(projectReferences.sourceProjectId, projects.id))
      .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
      .innerJoin(users, eq(projectReferences.createdBy, users.id))
      .where(eq(projectReferences.targetProjectId, projectId));

    return NextResponse.json({
      data: {
        outgoing: outgoingReferences,
        incoming: incomingReferences,
      },
      success: true,
    });
  } catch (error: unknown) {
    console.error("Error fetching project references:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[projectId]/references - Create project reference
export async function POST(
  req: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = params;
    const body = await req.json();
    const validatedData = createProjectReferenceSchema.parse(body);

    // Check source project access (need ADMIN+ role to create references)
    const sourceProjectAccess = await checkProjectAccess(projectId, userId, [
      "OWNER",
      "ADMIN",
    ]);
    if (!sourceProjectAccess) {
      return NextResponse.json(
        { error: "Insufficient permissions to create project reference" },
        { status: 403 }
      );
    }

    // Prevent self-reference
    if (projectId === validatedData.targetProjectId) {
      return NextResponse.json(
        { error: "Cannot create reference to the same project" },
        { status: 400 }
      );
    }

    // Check if target project exists and user has access to it
    const targetProjectAccess = await checkProjectAccess(
      validatedData.targetProjectId,
      userId
    );
    if (!targetProjectAccess) {
      return NextResponse.json(
        { error: "Target project not found or access denied" },
        { status: 404 }
      );
    }

    // Check if reference already exists
    const existingReference = await db
      .select()
      .from(projectReferences)
      .where(
        and(
          eq(projectReferences.sourceProjectId, projectId),
          eq(projectReferences.targetProjectId, validatedData.targetProjectId),
          eq(projectReferences.referenceType, validatedData.referenceType)
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
      .insert(projectReferences)
      .values({
        sourceProjectId: projectId,
        targetProjectId: validatedData.targetProjectId,
        referenceType: validatedData.referenceType,
        description: validatedData.description,
        createdBy: userId,
      })
      .returning();

    // Fetch the complete reference with related data
    const completeReference = await db
      .select({
        id: projectReferences.id,
        sourceProjectId: projectReferences.sourceProjectId,
        targetProjectId: projectReferences.targetProjectId,
        referenceType: projectReferences.referenceType,
        description: projectReferences.description,
        createdBy: projectReferences.createdBy,
        createdAt: projectReferences.createdAt,
        updatedAt: projectReferences.updatedAt,
        targetProject: {
          id: projects.id,
          name: projects.name,
          slug: projects.slug,
          description: projects.description,
          workspaceId: projects.workspaceId,
        },
        targetWorkspace: {
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
        },
      })
      .from(projectReferences)
      .innerJoin(projects, eq(projectReferences.targetProjectId, projects.id))
      .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
      .where(eq(projectReferences.id, newReference.id))
      .limit(1);

    return NextResponse.json({
      data: completeReference[0],
      success: true,
      message: "Project reference created successfully",
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating project reference:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
