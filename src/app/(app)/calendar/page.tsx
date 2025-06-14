"use client";

import { useState } from "react";
import {
  Calendar,
  CheckSquare,
  Plus,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTasks } from "@/hooks/use-tasks";
import { TaskStatus, TaskPriority } from "@/lib/types";

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

export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState("calendar");
  const [showGlobalOnly, setShowGlobalOnly] = useState(false);

  // Fetch tasks
  const { data: tasks, isLoading } = useTasks({
    global: showGlobalOnly,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Group tasks by status for kanban view
  const tasksByStatus: Record<TaskStatus, typeof tasks> =
    tasks?.reduce((acc, task) => {
      const status =
        (task.metadata as { status?: TaskStatus })?.status || "TODO";
      if (!acc[status]) acc[status] = [];
      acc[status].push(task);
      return acc;
    }, {} as Record<TaskStatus, typeof tasks>) ||
    ({} as Record<TaskStatus, typeof tasks>);

  const statusColumns: { status: TaskStatus; title: string; color: string }[] =
    [
      { status: "TODO", title: "To Do", color: "border-gray-200" },
      { status: "IN_PROGRESS", title: "In Progress", color: "border-blue-200" },
      { status: "IN_REVIEW", title: "In Review", color: "border-yellow-200" },
      { status: "DONE", title: "Done", color: "border-green-200" },
    ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Calendar & Tasks</h1>
          <p className="text-muted-foreground">
            Manage your schedule and tasks in one place
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setShowGlobalOnly(!showGlobalOnly)}
              >
                {showGlobalOnly ? "Show All Tasks" : "Show Global Tasks Only"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Kanban Board
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>
                Calendar integration coming soon. For now, showing tasks with
                due dates.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {tasks
                    ?.filter(
                      (task) => (task.metadata as { dueDate?: string })?.dueDate
                    )
                    .map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge
                              className={getStatusColor(
                                (task.metadata as { status?: TaskStatus })
                                  ?.status || "TODO"
                              )}
                            >
                              {(task.metadata as { status?: TaskStatus })
                                ?.status || "TODO"}
                            </Badge>
                            <Badge
                              className={getPriorityColor(
                                (task.metadata as { priority?: TaskPriority })
                                  ?.priority || "MEDIUM"
                              )}
                            >
                              {(task.metadata as { priority?: TaskPriority })
                                ?.priority || "MEDIUM"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Due:{" "}
                            {new Date(
                              (task.metadata as { dueDate?: string })
                                ?.dueDate || ""
                            ).toLocaleDateString()}
                          </span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>Edit Task</DropdownMenuItem>
                              <DropdownMenuItem>Mark Complete</DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )) || (
                    <p className="text-center text-muted-foreground py-8">
                      No tasks with due dates found
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kanban" className="space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statusColumns.map((column) => (
                <Card
                  key={column.status}
                  className={`${column.color} border-2`}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center justify-between">
                      {column.title}
                      <Badge variant="secondary">
                        {tasksByStatus[column.status]?.length || 0}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(tasksByStatus[column.status] || []).map((task) => (
                      <Card
                        key={task.id}
                        className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {task.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Move to...</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {(task.content as { description?: string })
                            ?.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {
                                (task.content as { description?: string })
                                  .description
                              }
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <Badge
                              className={getPriorityColor(
                                (task.metadata as { priority?: TaskPriority })
                                  ?.priority || "MEDIUM"
                              )}
                            >
                              {(task.metadata as { priority?: TaskPriority })
                                ?.priority || "MEDIUM"}
                            </Badge>

                            {task.project && (
                              <span className="text-xs text-muted-foreground">
                                {task.project.name}
                              </span>
                            )}
                          </div>

                          {(task.metadata as { dueDate?: string })?.dueDate && (
                            <div className="text-xs text-muted-foreground">
                              Due:{" "}
                              {new Date(
                                (task.metadata as { dueDate?: string })
                                  .dueDate || ""
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                    {(!tasksByStatus[column.status] ||
                      (tasksByStatus[column.status] &&
                        tasksByStatus[column.status]!.length === 0)) && (
                      <p className="text-center text-muted-foreground text-sm py-4">
                        No tasks
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
