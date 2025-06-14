import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, documentLocks } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { UpdateDocumentData } from "@/lib/types";

// GET /api/documents/[id] - Get single document
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

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

    // Check if document is locked
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
        ...document,
        lock: lock || null,
        isLocked: !!lock,
        canEdit: !lock, // For now, simple logic - can edit if not locked
      },
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch document",
      },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[id] - Update document
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const body: UpdateDocumentData = await request.json();

    // Check if document exists
    const [existingDocument] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!existingDocument) {
      return NextResponse.json(
        {
          success: false,
          error: "Document not found",
        },
        { status: 404 }
      );
    }

    // Check if document is locked by someone else
    const [lock] = await db
      .select()
      .from(documentLocks)
      .where(
        and(
          eq(documentLocks.documentId, documentId),
          gt(documentLocks.expiresAt, new Date())
        )
      );

    // For now, we'll allow updates if no lock exists
    // In a real app, you'd check if the current user owns the lock
    if (lock) {
      return NextResponse.json(
        {
          success: false,
          error: "Document is currently being edited by another user",
        },
        { status: 409 }
      );
    }

    // Update the document
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (body.title !== undefined) {
      updateData.title = body.title.trim();
    }

    if (body.content !== undefined) {
      updateData.content = body.content;
    }

    const [updatedDocument] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, documentId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    console.error("Error updating document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update document",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;

    // Check if document exists
    const [existingDocument] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));

    if (!existingDocument) {
      return NextResponse.json(
        {
          success: false,
          error: "Document not found",
        },
        { status: 404 }
      );
    }

    // Check if document is locked
    const [lock] = await db
      .select()
      .from(documentLocks)
      .where(
        and(
          eq(documentLocks.documentId, documentId),
          gt(documentLocks.expiresAt, new Date())
        )
      );

    if (lock) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete document while it's being edited",
        },
        { status: 409 }
      );
    }

    // Delete the document (locks and versions will be cascade deleted)
    await db.delete(documents).where(eq(documents.id, documentId));

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete document",
      },
      { status: 500 }
    );
  }
}
