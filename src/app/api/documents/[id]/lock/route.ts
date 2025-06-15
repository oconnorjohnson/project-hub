import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, documentLocks } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

// POST /api/documents/[id]/lock - Acquire lock
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // For now, we'll use a simple session identifier
    // In a real app, this would come from authentication
    const sessionId = `session-${Date.now()}-${Math.random()}`;

    // Check if document exists
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!document) {
      return NextResponse.json(
        {
          success: false,
          error: "Document not found",
        },
        { status: 404 }
      );
    }

    // Check if document is already locked
    const [existingLock] = await db
      .select()
      .from(documentLocks)
      .where(
        and(
          eq(documentLocks.documentId, documentId),
          gt(documentLocks.expiresAt, new Date())
        )
      );

    if (existingLock) {
      return NextResponse.json(
        {
          success: false,
          error: "Document is already locked by another user",
          lock: existingLock,
        },
        { status: 409 }
      );
    }

    // Clean up any expired locks for this document
    await db
      .delete(documentLocks)
      .where(eq(documentLocks.documentId, documentId));

    // Create new lock (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    const [newLock] = await db
      .insert(documentLocks)
      .values({
        documentId,
        lockedBy: sessionId,
        expiresAt,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newLock,
    });
  } catch (error) {
    console.error("Error acquiring document lock:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to acquire document lock",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id]/lock - Release lock
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "Session ID is required",
        },
        { status: 400 }
      );
    }

    // Find and delete the lock if it belongs to this session
    const deletedLocks = await db
      .delete(documentLocks)
      .where(
        and(
          eq(documentLocks.documentId, documentId),
          eq(documentLocks.lockedBy, sessionId)
        )
      )
      .returning();

    if (deletedLocks.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No lock found for this session",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Lock released successfully",
    });
  } catch (error) {
    console.error("Error releasing document lock:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to release document lock",
      },
      { status: 500 }
    );
  }
}

// GET /api/documents/[id]/lock - Check lock status
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const documentId = context.params.id;

    // Check for active lock
    const [lock] = await db
      .select()
      .from(documentLocks)
      .where(
        and(
          eq(documentLocks.documentId, documentId),
          gt(documentLocks.expiresAt, new Date())
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        isLocked: !!lock,
        lock: lock || null,
        canEdit: !lock,
      },
    });
  } catch (error) {
    console.error("Error checking document lock status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to check lock status",
      },
      { status: 500 }
    );
  }
}
