"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Document } from "@/lib/types";
import { useDeleteDocument } from "@/hooks/use-documents";
import { toast } from "sonner";

interface DocumentCardProps {
  document: Document;
}

export function DocumentCard({ document }: DocumentCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutateAsync: deleteDocument } = useDeleteDocument();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this document?")) return;

    setIsDeleting(true);
    try {
      await deleteDocument(document.id);
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error("Failed to delete document");
      console.error("Error deleting document:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getContentPreview = () => {
    // Extract text content from TipTap JSON for preview
    if (!document.content || typeof document.content !== "object") return "";

    const extractText = (content: any): string => {
      if (content.text) return content.text;
      if (content.content && Array.isArray(content.content)) {
        return content.content.map(extractText).join(" ");
      }
      return "";
    };

    const text = extractText(document.content);
    return text.length > 150 ? text.substring(0, 150) + "..." : text;
  };

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Link
              href={`/documents/${document.id}`}
              className="font-medium text-sm hover:underline truncate"
            >
              {document.title}
            </Link>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isDeleting}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/documents/${document.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {document.projectId ? (
            <Badge variant="secondary" className="text-xs">
              Project
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs">
              Global
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Link href={`/documents/${document.id}`} className="block">
          {getContentPreview() && (
            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {getContentPreview()}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(document.updatedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{document.createdBy}</span>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  );
}
