"use client";

import { useParams, useRouter } from "next/navigation";
import {
  Edit,
  ArrowLeft,
  MoreHorizontal,
  Trash2,
  Calendar,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDocument, useDeleteDocument } from "@/hooks/use-documents";
import { toast } from "sonner";

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const { data: document, isLoading } = useDocument(documentId);
  const { mutateAsync: deleteDocument } = useDeleteDocument();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      await deleteDocument(documentId);
      toast.success("Document deleted successfully");
      router.push("/documents");
    } catch (error) {
      toast.error("Failed to delete document");
      console.error("Error deleting document:", error);
    }
  };

  const renderContent = () => {
    if (!document?.content) return null;

    // Simple text extraction from TipTap JSON
    const extractText = (content: any): string => {
      if (content.text) return content.text;
      if (content.content && Array.isArray(content.content)) {
        return content.content.map(extractText).join("\n");
      }
      return "";
    };

    const text = extractText(document.content);

    return (
      <div className="prose prose-sm max-w-none">
        {text.split("\n").map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Document not found</h1>
          <p className="text-muted-foreground mb-4">
            The document you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <Button onClick={() => router.push("/documents")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/documents")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documents
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/documents/${documentId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold">{document.title}</h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>
                Updated {new Date(document.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>Created by {document.createdBy}</span>
            </div>
            {document.projectId ? (
              <Badge variant="secondary">Project Document</Badge>
            ) : (
              <Badge variant="outline">Global Document</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="p-8">
          {document.content ? (
            renderContent()
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>This document is empty.</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push(`/documents/${documentId}/edit`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
