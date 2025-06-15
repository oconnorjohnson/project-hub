"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Globe,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocuments } from "@/hooks/use-documents";
import { DocumentFilters } from "@/lib/types";
import { CreateDocumentDialog } from "@/components/documents/create-document-dialog";
import { DocumentCard } from "@/components/documents/document-card";

export default function DocumentsPage() {
  const [filters, setFilters] = useState<DocumentFilters>({
    sortBy: "updatedAt",
    sortOrder: "desc",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { data: documents = [], isLoading } = useDocuments({
    ...filters,
    search: searchQuery || undefined,
  });

  const handleFilterChange = (newFilters: Partial<DocumentFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const getFilterLabel = () => {
    if (filters.global) return "Global Documents";
    if (filters.projectId) return "Project Documents";
    return "All Documents";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Documents</h1>
        <p className="text-muted-foreground">
          Create and manage your notes, documentation, and knowledge base.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {getFilterLabel()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() =>
                handleFilterChange({ global: false, projectId: undefined })
              }
            >
              <FileText className="h-4 w-4 mr-2" />
              All Documents
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleFilterChange({ global: true, projectId: undefined })
              }
            >
              <Globe className="h-4 w-4 mr-2" />
              Global Documents
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // TODO: Add project selector
                console.log("Project filter not implemented yet");
              }}
            >
              <FolderOpen className="h-4 w-4 mr-2" />
              Project Documents
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Sort:{" "}
              {filters.sortBy === "title"
                ? "Title"
                : filters.sortBy === "createdAt"
                ? "Created"
                : "Updated"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              onClick={() =>
                handleFilterChange({ sortBy: "updatedAt", sortOrder: "desc" })
              }
            >
              Recently Updated
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleFilterChange({ sortBy: "createdAt", sortOrder: "desc" })
              }
            >
              Recently Created
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                handleFilterChange({ sortBy: "title", sortOrder: "asc" })
              }
            >
              Title A-Z
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Document
        </Button>
      </div>

      {/* Documents Grid */}
      {documents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium">No documents found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "Create your first document to get started"}
              </p>
            </div>
            {!searchQuery && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Document
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Create Document Dialog */}
      <CreateDocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
}
