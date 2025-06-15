import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { eq, and, isNull, desc, asc, ilike, or } from "drizzle-orm";
import { CreateDocumentData, DocumentFilters } from "@/lib/types";

// GET /api/documents - List documents with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const filters: DocumentFilters = {
      projectId: searchParams.get("projectId") || undefined,
      global: searchParams.get("global") === "true",
      search: searchParams.get("search") || undefined,
      sortBy:
        (searchParams.get("sortBy") as "title" | "createdAt" | "updatedAt") ||
        "updatedAt",
      sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || "desc",
    };

    // Simple query approach to avoid TypeScript issues
    let result;

    if (filters.projectId) {
      // Filter by specific project
      result = await db
        .select()
        .from(documents)
        .where(eq(documents.projectId, filters.projectId))
        .orderBy(desc(documents.updatedAt));
    } else if (filters.global) {
      // Filter global documents only
      result = await db
        .select()
        .from(documents)
        .where(isNull(documents.projectId))
        .orderBy(desc(documents.updatedAt));
    } else {
      // Get all documents
      result = await db
        .select()
        .from(documents)
        .orderBy(desc(documents.updatedAt));
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch documents",
      },
      { status: 500 }
    );
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
  try {
    const body: CreateDocumentData = await request.json();

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Title is required",
        },
        { status: 400 }
      );
    }

    // For now, we'll use a placeholder user ID
    // In a real app, this would come from authentication
    const userId = "placeholder-user-id";

    const [newDocument] = await db
      .insert(documents)
      .values({
        title: body.title.trim(),
        content: body.content || {},
        projectId: body.projectId || null,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newDocument,
    });
  } catch (error) {
    console.error("Error creating document:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create document",
      },
      { status: 500 }
    );
  }
}
