"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateDocument } from "@/hooks/use-documents";
import { CreateDocumentData } from "@/lib/types";
import { toast } from "sonner";

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export function CreateDocumentDialog({
  open,
  onOpenChange,
  projectId,
}: CreateDocumentDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(
    projectId || "global"
  );
  const [isCreating, setIsCreating] = useState(false);

  const { mutateAsync: createDocument } = useCreateDocument();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setIsCreating(true);
    try {
      const documentData: CreateDocumentData = {
        title: title.trim(),
        content: description.trim()
          ? {
              type: "doc",
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: description.trim(),
                    },
                  ],
                },
              ],
            }
          : undefined,
        projectId:
          selectedProjectId === "global" ? undefined : selectedProjectId,
      };

      const newDocument = await createDocument(documentData);

      toast.success("Document created successfully");
      onOpenChange(false);

      // Reset form
      setTitle("");
      setDescription("");
      setSelectedProjectId(projectId || "global");

      // Navigate to the new document
      router.push(`/documents/${newDocument.id}/edit`);
    } catch (error) {
      toast.error("Failed to create document");
      console.error("Error creating document:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setSelectedProjectId(projectId || "global");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Create a new document to store notes, documentation, or any other
            content.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isCreating}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Initial Content (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add some initial content..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project (Optional)</Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={isCreating}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project or leave global" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Global Document</SelectItem>
                {/* TODO: Add project options from useProjects hook */}
                <SelectItem value="placeholder">Sample Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !title.trim()}>
              {isCreating ? "Creating..." : "Create Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
