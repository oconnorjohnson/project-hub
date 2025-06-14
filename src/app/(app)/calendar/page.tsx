"use client";

import { useState } from "react";
import { Calendar, Kanban, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTasks } from "@/hooks/use-tasks";
import { TaskStatus, TaskPriority, Task } from "@/lib/types";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { CalendarView } from "@/components/calendar/calendar-view";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";

export default function CalendarPage() {
  const [showGlobalOnly, setShowGlobalOnly] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  const { data: tasks = [], isLoading } = useTasks({
    global: showGlobalOnly,
  });

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleDateClick = (date: Date) => {
    // Could open a create task dialog with the date pre-filled
    console.log("Date clicked:", date);
  };

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

  const tasksByStatus = {
    TODO: tasks.filter(
      (task) =>
        (task.metadata as any)?.status === "TODO" ||
        !(task.metadata as any)?.status
    ),
    IN_PROGRESS: tasks.filter(
      (task) => (task.metadata as any)?.status === "IN_PROGRESS"
    ),
    IN_REVIEW: tasks.filter(
      (task) => (task.metadata as any)?.status === "IN_REVIEW"
    ),
    DONE: tasks.filter((task) => (task.metadata as any)?.status === "DONE"),
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
        <h1 className="text-3xl font-bold">Calendar & Tasks</h1>
        <p className="text-muted-foreground">
          Manage your tasks and schedule in calendar and kanban views.
        </p>
      </div>

      <Tabs defaultValue="calendar" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Kanban className="h-4 w-4" />
              Kanban
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  {showGlobalOnly ? "Global Tasks" : "All Tasks"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setShowGlobalOnly(false)}>
                  All Tasks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowGlobalOnly(true)}>
                  Global Tasks Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <CreateTaskDialog />
          </div>
        </div>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView
            tasks={tasks}
            onTaskClick={handleTaskClick}
            onDateClick={handleDateClick}
          />
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {Object.entries(tasksByStatus).map(([status, statusTasks]) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {status.replace("_", " ")}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {statusTasks.length}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-card border rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow"
                      onClick={() => handleTaskClick(task)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm line-clamp-2">
                            {task.title}
                          </h4>
                          <Badge
                            className={getPriorityColor(
                              (task.metadata as any)?.priority || "MEDIUM"
                            )}
                          >
                            {(task.metadata as any)?.priority || "MEDIUM"}
                          </Badge>
                        </div>

                        {(task.content as any)?.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {(task.content as any).description}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                          {(task.metadata as any)?.dueDate && (
                            <span>
                              Due{" "}
                              {new Date(
                                (task.metadata as any).dueDate
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {task.projectId && (
                          <Badge variant="outline" className="text-xs">
                            Project Task
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {statusTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No {status.toLowerCase().replace("_", " ")} tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <TaskDetailDialog
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        onEdit={(task) => {
          // TODO: Implement edit functionality
          console.log("Edit task:", task);
        }}
      />
    </div>
  );
}
