"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Task, TaskStatus, TaskPriority } from "@/lib/types";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";

interface CalendarViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onDateClick?: (date: Date) => void;
  projectId?: string;
}

type ViewMode = "month" | "week";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function CalendarView({
  tasks,
  onTaskClick,
  onDateClick,
  projectId,
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");

  const { calendarDays, monthYear } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Get first day of month and calculate starting date
    const firstDayOfMonth = new Date(year, month, 1);
    const startingDayOfWeek = firstDayOfMonth.getDay();

    // Calculate the start date (including previous month days)
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - startingDayOfWeek);

    // Generate 42 days (6 weeks) for the calendar grid
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }

    return {
      calendarDays: days,
      monthYear: `${MONTHS[month]} ${year}`,
    };
  }, [currentDate]);

  const weekDays = useMemo(() => {
    if (viewMode !== "week") return [];

    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push(date);
    }

    return days;
  }, [currentDate, viewMode]);

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      const taskDate = task.metadata?.dueDate
        ? new Date(task.metadata.dueDate)
        : null;
      if (!taskDate) return false;

      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case "TODO":
        return "bg-gray-500";
      case "IN_PROGRESS":
        return "bg-blue-500";
      case "IN_REVIEW":
        return "bg-yellow-500";
      case "DONE":
        return "bg-green-500";
      case "CANCELLED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case "LOW":
        return "border-l-green-500";
      case "MEDIUM":
        return "border-l-yellow-500";
      case "HIGH":
        return "border-l-orange-500";
      case "URGENT":
        return "border-l-red-500";
      default:
        return "border-l-gray-500";
    }
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const navigate = (direction: "prev" | "next") => {
    if (viewMode === "month") {
      navigateMonth(direction);
    } else {
      navigateWeek(direction);
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const renderDayCell = (date: Date, isWeekView = false) => {
    const dayTasks = getTasksForDate(date);
    const isCurrentDay = isToday(date);
    const isInCurrentMonth = isCurrentMonth(date);

    return (
      <div
        key={date.toISOString()}
        className={cn(
          "border border-border bg-background p-2 min-h-[120px] cursor-pointer hover:bg-accent/50 transition-colors",
          isWeekView && "min-h-[200px]",
          !isInCurrentMonth &&
            viewMode === "month" &&
            "bg-muted/30 text-muted-foreground",
          isCurrentDay && "bg-primary/5 border-primary/20"
        )}
        onClick={() => onDateClick?.(date)}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className={cn(
              "text-sm font-medium",
              isCurrentDay &&
                "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs"
            )}
          >
            {date.getDate()}
          </span>

          {dayTasks.length > 0 && (
            <CreateTaskDialog
              projectId={projectId}
              trigger={
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              }
            />
          )}
        </div>

        <div className="space-y-1">
          {dayTasks.slice(0, isWeekView ? 8 : 3).map((task) => (
            <div
              key={task.id}
              className={cn(
                "text-xs p-1 rounded border-l-2 bg-card hover:bg-accent cursor-pointer truncate",
                getPriorityColor(task.metadata?.priority || "MEDIUM")
              )}
              onClick={(e) => {
                e.stopPropagation();
                onTaskClick?.(task);
              }}
            >
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    getStatusColor(task.metadata?.status || "TODO")
                  )}
                />
                <span className="truncate">{task.title}</span>
              </div>
            </div>
          ))}

          {dayTasks.length > (isWeekView ? 8 : 3) && (
            <div className="text-xs text-muted-foreground">
              +{dayTasks.length - (isWeekView ? 8 : 3)} more
            </div>
          )}
        </div>

        {dayTasks.length === 0 && (
          <CreateTaskDialog
            projectId={projectId}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 opacity-0 hover:opacity-100 transition-opacity mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            }
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <h2 className="text-xl font-semibold">
            {viewMode === "month"
              ? monthYear
              : `Week of ${weekDays[0]?.toLocaleDateString()}`}
          </h2>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-md border">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="rounded-r-none"
            >
              Month
            </Button>
            <Button
              variant={viewMode === "week" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("week")}
              className="rounded-l-none"
            >
              Week
            </Button>
          </div>

          <CreateTaskDialog projectId={projectId} />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b bg-muted/30">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="p-3 text-sm font-medium text-center border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        {viewMode === "month" ? (
          <div className="grid grid-cols-7">
            {calendarDays.map((date) => (
              <div
                key={date.toISOString()}
                className="group border-r border-b last:border-r-0"
              >
                {renderDayCell(date)}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {weekDays.map((date) => (
              <div
                key={date.toISOString()}
                className="group border-r last:border-r-0"
              >
                {renderDayCell(date, true)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Status:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500" />
            <span>Todo</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>Review</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Done</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span>Priority:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 border-l-2 border-l-red-500" />
            <span>Urgent</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-2 border-l-2 border-l-orange-500" />
            <span>High</span>
          </div>
        </div>
      </div>
    </div>
  );
}
