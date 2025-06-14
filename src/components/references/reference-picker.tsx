"use client";

import { useState } from "react";
import { Search, Building2, FolderOpen, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { useDebouncedSearch, filterSearchResults } from "@/hooks/use-search";
import {
  WorkspaceReferenceType,
  ProjectReferenceType,
  Workspace,
  Project,
} from "@/lib/types";

interface ReferencePickerProps {
  type: "workspace" | "project";
  onSelect: (
    reference: Workspace | Project,
    referenceType: WorkspaceReferenceType | ProjectReferenceType
  ) => void;
  excludeIds?: string[];
  trigger?: React.ReactNode;
  disabled?: boolean;
}

const workspaceReferenceTypes: {
  value: WorkspaceReferenceType;
  label: string;
  description: string;
}[] = [
  {
    value: "DEPENDENCY",
    label: "Dependency",
    description: "This workspace depends on the target workspace",
  },
  {
    value: "COLLABORATION",
    label: "Collaboration",
    description: "This workspace collaborates with the target workspace",
  },
  {
    value: "PARENT_CHILD",
    label: "Parent-Child",
    description:
      "This workspace has a parent-child relationship with the target",
  },
];

const projectReferenceTypes: {
  value: ProjectReferenceType;
  label: string;
  description: string;
}[] = [
  {
    value: "DEPENDENCY",
    label: "Dependency",
    description: "This project depends on the target project",
  },
  {
    value: "BLOCKS",
    label: "Blocks",
    description: "This project blocks the target project",
  },
  {
    value: "RELATED",
    label: "Related",
    description: "This project is related to the target project",
  },
  {
    value: "SUBTASK",
    label: "Subtask",
    description: "This project is a subtask of the target project",
  },
];

export function ReferencePicker({
  type,
  onSelect,
  excludeIds = [],
  trigger,
  disabled = false,
}: ReferencePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReferenceType, setSelectedReferenceType] = useState<
    WorkspaceReferenceType | ProjectReferenceType | ""
  >("");
  const [selectedItem, setSelectedItem] = useState<Workspace | Project | null>(
    null
  );

  const { data: searchResults, isLoading } = useDebouncedSearch({
    query: searchQuery,
    type: type === "workspace" ? "workspaces" : "projects",
    excludeIds,
    limit: 10,
  });

  const referenceTypes =
    type === "workspace" ? workspaceReferenceTypes : projectReferenceTypes;
  const results = searchResults
    ? type === "workspace"
      ? filterSearchResults(searchResults.results, "workspace")
      : filterSearchResults(searchResults.results, "project")
    : [];

  const handleSelect = () => {
    if (selectedItem && selectedReferenceType) {
      onSelect(
        selectedItem,
        selectedReferenceType as WorkspaceReferenceType | ProjectReferenceType
      );
      setIsOpen(false);
      setSearchQuery("");
      setSelectedReferenceType("");
      setSelectedItem(null);
    }
  };

  const canSelect = selectedItem && selectedReferenceType;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" disabled={disabled}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Add {type === "workspace" ? "Workspace" : "Project"} Reference
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Add {type === "workspace" ? "Workspace" : "Project"} Reference
          </DialogTitle>
          <DialogDescription>
            Search for a {type} to create a reference to, then select the type
            of relationship.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">
              Search {type === "workspace" ? "Workspaces" : "Projects"}
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder={`Search ${
                  type === "workspace" ? "workspaces" : "projects"
                }...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="space-y-2">
              <Label>Search Results</Label>
              <div className="h-48 border rounded-md overflow-y-auto">
                <div className="p-2 space-y-2">
                  {isLoading ? (
                    <div className="text-center text-muted-foreground py-4">
                      Searching...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center text-muted-foreground py-4">
                      No {type === "workspace" ? "workspaces" : "projects"}{" "}
                      found
                    </div>
                  ) : (
                    results.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedItem?.id === item.id
                            ? "border-primary bg-primary/5"
                            : "hover:border-muted-foreground/50"
                        }`}
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-start gap-3">
                          {type === "workspace" ? (
                            <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                          ) : (
                            <FolderOpen className="h-5 w-5 text-muted-foreground mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate">
                                {item.name}
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                {item.userRole?.toLowerCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {item.description || `/${item.slug}`}
                            </p>
                            {type === "project" && "workspace" in item && (
                              <p className="text-xs text-muted-foreground">
                                in {item.workspace.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Reference Type Selection */}
          {selectedItem && (
            <div className="space-y-2">
              <Label htmlFor="reference-type">Reference Type</Label>
              <Select
                value={selectedReferenceType}
                onValueChange={(value) =>
                  setSelectedReferenceType(
                    value as WorkspaceReferenceType | ProjectReferenceType
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select reference type" />
                </SelectTrigger>
                <SelectContent>
                  {referenceTypes.map((refType) => (
                    <SelectItem key={refType.value} value={refType.value}>
                      <div>
                        <div className="font-medium">{refType.label}</div>
                        <div className="text-xs text-muted-foreground">
                          {refType.description}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Item Preview */}
          {selectedItem && (
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                {type === "workspace" ? (
                  <Building2 className="h-4 w-4" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
                <span className="font-medium">Selected {type}:</span>
              </div>
              <p className="text-sm">{selectedItem.name}</p>
              {selectedItem.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedItem.description}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setSearchQuery("");
                setSelectedReferenceType("");
                setSelectedItem(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSelect} disabled={!canSelect}>
              Create Reference
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
