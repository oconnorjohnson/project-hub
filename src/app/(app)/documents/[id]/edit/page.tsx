"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save, ArrowLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocument, useUpdateDocument } from "@/hooks/use-documents";
import { toast } from "sonner";

export default function DocumentEditPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as string;

  const { data: document, isLoading } = useDocument(documentId);
  const { mutateAsync: updateDocument } = useUpdateDocument();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Initialize form when document loads
  useEffect(() => {
    if (document) {
      setTitle(document.title);

      // Extract text content from TipTap JSON
      const extractText = (content: any): string => {
        if (!content) return "";
        if (content.text) return content.text;
        if (content.content && Array.isArray(content.content)) {
          return content.content.map(extractText).join("\n");
        }
        return "";
      };

      setContent(extractText(document.content));
    }
  }, [document]);

  // Track unsaved changes
  useEffect(() => {
    if (document) {
      const originalContent = document.content
        ? JSON.stringify(document.content)
        : "";
      const currentContent = content.trim();
      const originalTitle = document.title;

      setHasUnsavedChanges(
        title !== originalTitle ||
          (currentContent !== "" &&
            currentContent !== extractTextFromContent(document.content))
      );
    }
  }, [title, content, document]);

  const extractTextFromContent = (content: any): string => {
    if (!content) return "";
    if (content.text) return content.text;
    if (content.content && Array.isArray(content.content)) {
      return content.content.map(extractTextFromContent).join("\n");
    }
    return "";
  };

  const handleSave = async () => {
    if (!document) return;

    setIsSaving(true);
    try {
      // Convert plain text to TipTap JSON format
      const tipTapContent = content.trim()
        ? {
            type: "doc",
            content: content.split("\n").map((paragraph) => ({
              type: "paragraph",
              content: paragraph.trim()
                ? [
                    {
                      type: "text",
                      text: paragraph,
                    },
                  ]
                : [],
            })),
          }
        : undefined;

      await updateDocument({
        id: documentId,
        data: {
          title: title.trim(),
          content: tipTapContent,
        },
      });

      setHasUnsavedChanges(false);
      toast.success("Document saved successfully");
    } catch (error) {
      toast.error("Failed to save document");
      console.error("Error saving document:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
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
            The document you're trying to edit doesn't exist or you don't have
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
    <div className="p-6 max-w-4xl mx-auto" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/documents/${documentId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to View
          </Button>

          <div className="flex items-center gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/documents/${documentId}`)}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Edit Document</h1>
          {document.projectId ? (
            <Badge variant="secondary">Project Document</Badge>
          ) : (
            <Badge variant="outline">Global Document</Badge>
          )}
          {hasUnsavedChanges && (
            <Badge variant="destructive">Unsaved Changes</Badge>
          )}
        </div>
      </div>

      {/* Editor */}
      <Card>
        <CardHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title..."
                className="text-lg font-medium"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your document..."
              className="min-h-[500px] font-mono text-sm"
              style={{ resize: "vertical" }}
            />
            <p className="text-xs text-muted-foreground">
              Tip: Press Ctrl+S to save quickly
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
