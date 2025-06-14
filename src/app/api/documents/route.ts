import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { documents, documentLocks } from "@/lib/db/schema";
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
      sortBy: (searchParams.get("sortBy") as any) || "updatedAt",
      sortOrder: (searchParams.get("sortOrder") as any) || "desc",
    };

    // Build the query
    let query = db
      .select({
        id: documents.id,
        title: documents.title,
        content: documents.content,
        projectId: documents.projectId,
        createdBy: documents.createdBy,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
      })
      .from(documents);

    // Apply filters
    const conditions = [];

    if (filters.projectId) {
      conditions.push(eq(documents.projectId, filters.projectId));
    }

    if (filters.global) {
      conditions.push(isNull(documents.projectId));
    }

    if (filters.search) {
      conditions.push(
        or(
          ilike(documents.title, `%${filters.search}%`)
          // Note: Searching in JSONB content would require more complex queries
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    if (filters.sortBy === "title") {
      query = query.orderBy(
        filters.sortOrder === "asc"
          ? asc(documents.title)
          : desc(documents.title)
      );
    } else if (filters.sortBy === "createdAt") {
      query = query.orderBy(
        filters.sortOrder === "asc"
          ? asc(documents.createdAt)
          : desc(documents.createdAt)
      );
    } else {
      // Default to updatedAt
      query = query.orderBy(
        filters.sortOrder === "asc"
          ? asc(documents.updatedAt)
          : desc(documents.updatedAt)
      );
    }

    const result = await query;

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
