import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { workspaces, projects, userWorkspaceRoles } from "@/lib/db/schema";
import { eq, and, or, ilike, notInArray } from "drizzle-orm";
import { z } from "zod";

// Search result types
interface SearchResultWorkspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: Date;
  userRole: string;
  type: "workspace";
}

interface SearchResultProject {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  workspaceId: string;
  createdAt: Date;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: string;
  type: "project";
}

type SearchResult = SearchResultWorkspace | SearchResultProject;

const searchSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  type: z.enum(["workspaces", "projects", "all"]).default("all"),
  excludeIds: z.array(z.string().uuid()).optional().default([]),
  limit: z.number().min(1).max(50).default(20),
});

// GET /api/search - Search workspaces and projects
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const validatedParams = searchSchema.parse({
      query: searchParams.get("query"),
      type: searchParams.get("type") || "all",
      excludeIds:
        searchParams.get("excludeIds")?.split(",").filter(Boolean) || [],
      limit: parseInt(searchParams.get("limit") || "20"),
    });

    const { query, type, excludeIds, limit } = validatedParams;

    let workspaceResults: SearchResult[] = [];
    let projectResults: SearchResult[] = [];

    // Search workspaces if requested
    if (type === "workspaces" || type === "all") {
      const workspaceQuery = db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          slug: workspaces.slug,
          description: workspaces.description,
          createdAt: workspaces.createdAt,
          userRole: userWorkspaceRoles.role,
        })
        .from(workspaces)
        .innerJoin(
          userWorkspaceRoles,
          eq(workspaces.id, userWorkspaceRoles.workspaceId)
        )
        .where(
          and(
            eq(userWorkspaceRoles.userId, userId),
            or(
              ilike(workspaces.name, `%${query}%`),
              ilike(workspaces.slug, `%${query}%`),
              ilike(workspaces.description, `%${query}%`)
            ),
            excludeIds.length > 0
              ? notInArray(workspaces.id, excludeIds)
              : undefined
          )
        )
        .limit(Math.floor(limit / (type === "all" ? 2 : 1)));

      workspaceResults = (await workspaceQuery).map((result) => ({
        ...result,
        type: "workspace" as const,
      }));
    }

    // Search projects if requested
    if (type === "projects" || type === "all") {
      const projectQuery = db
        .select({
          id: projects.id,
          name: projects.name,
          slug: projects.slug,
          description: projects.description,
          workspaceId: projects.workspaceId,
          createdAt: projects.createdAt,
          workspace: {
            id: workspaces.id,
            name: workspaces.name,
            slug: workspaces.slug,
          },
          userRole: userWorkspaceRoles.role,
        })
        .from(projects)
        .innerJoin(workspaces, eq(projects.workspaceId, workspaces.id))
        .innerJoin(
          userWorkspaceRoles,
          eq(workspaces.id, userWorkspaceRoles.workspaceId)
        )
        .where(
          and(
            eq(userWorkspaceRoles.userId, userId),
            or(
              ilike(projects.name, `%${query}%`),
              ilike(projects.slug, `%${query}%`),
              ilike(projects.description, `%${query}%`)
            ),
            excludeIds.length > 0
              ? notInArray(projects.id, excludeIds)
              : undefined
          )
        )
        .limit(Math.floor(limit / (type === "all" ? 2 : 1)));

      projectResults = (await projectQuery).map((result) => ({
        ...result,
        type: "project" as const,
      }));
    }

    // Combine and sort results by relevance (name matches first, then description)
    const allResults = [...workspaceResults, ...projectResults];

    const sortedResults = allResults.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase());
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase());

      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;

      // If both or neither match name, sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      data: {
        results: sortedResults.slice(0, limit),
        total: sortedResults.length,
        query,
        type,
      },
      success: true,
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
