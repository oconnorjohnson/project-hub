"use client";

import { Calendar, Clock, Flag, Edit, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { useUpdateTaskStatus, useDeleteTask } from "@/hooks/use-tasks";
import { toast } from "sonner";

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (task: Task) => void;
}

export function TaskDetailDialog({
  task,
  isOpen,
  onClose,
  onEdit,
}: TaskDetailDialogProps) {
  const { mutateAsync: updateTaskStatus } = useUpdateTaskStatus();
  const { mutateAsync: deleteTask } = useDeleteTask();

  if (!task) return null;

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_REVIEW":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "DONE":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800";
      case "HIGH":
        return "bg-orange-100 text-orange-800";
      case "URGENT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case "URGENT":
        return "🔴";
      case "HIGH":
        return "🟠";
      case "MEDIUM":
        return "🟡";
      case "LOW":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    try {
      await updateTaskStatus({ id: task.id, status: newStatus });
      toast.success("Task status updated!");
      onClose();
    } catch (error) {
      toast.error("Failed to update task status");
      console.error("Error updating task status:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      await deleteTask(task.id);
      toast.success("Task deleted!");
      onClose();
    } catch (error) {
      toast.error("Failed to delete task");
      console.error("Error deleting task:", error);
    }
  };

  const taskMetadata = task.metadata as {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
  };
  const taskContent = task.content as { description?: string };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge
                  className={getStatusColor(taskMetadata?.status || "TODO")}
                >
                  {taskMetadata?.status || "TODO"}
                </Badge>
                <Badge
                  className={getPriorityColor(
                    taskMetadata?.priority || "MEDIUM"
                  )}
                >
                  {getPriorityIcon(taskMetadata?.priority || "MEDIUM")}{" "}
                  {taskMetadata?.priority || "MEDIUM"}
                </Badge>
                {task.projectId && (
                  <Badge variant="outline">Project Task</Badge>
                )}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleStatusChange("DONE")}
                  disabled={taskMetadata?.status === "DONE"}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Description */}
          {taskContent?.description && (
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {taskContent.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Task Details */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Flag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Priority</p>
                  <p className="text-sm text-muted-foreground">
                    {taskMetadata?.priority || "Medium"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm text-muted-foreground">
                    {taskMetadata?.status || "To Do"}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {taskMetadata?.dueDate && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(taskMetadata.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Created</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Actions */}
          <div>
            <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
            <div className="flex gap-2">
              {taskMetadata?.status !== "TODO" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("TODO")}
                >
                  Mark as To Do
                </Button>
              )}
              {taskMetadata?.status !== "IN_PROGRESS" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("IN_PROGRESS")}
                >
                  Start Progress
                </Button>
              )}
              {taskMetadata?.status !== "DONE" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusChange("DONE")}
                >
                  Mark Complete
                </Button>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onEdit?.(task)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
