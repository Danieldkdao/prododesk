import { TaskPriority, TaskStatus } from "@/db/shared";
import {
  ChevronDownCircleIcon,
  ChevronUpCircleIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  CircleDashedIcon,
  CircleDotIcon,
  CircleIcon,
  MinusCircleIcon,
} from "lucide-react";
import { DayTasksSortByOption } from "./tasks-params";

export const formatTaskPriority = (priority: TaskPriority) => {
  switch (priority) {
    case "low":
      return {
        label: "Low",
        icon: ChevronDownCircleIcon,
        textColor: "text-blue-600 dark:text-blue-400",
      };
    case "medium":
      return {
        label: "Medium",
        icon: MinusCircleIcon,
        textColor: "text-amber-600 dark:text-amber-400",
      };
    case "high":
      return {
        label: "High",
        icon: ChevronUpCircleIcon,
        textColor: "text-orange-600 dark:text-orange-400",
      };
    case "urgent":
      return {
        label: "Urgent",
        icon: CircleAlertIcon,
        textColor: "text-red-600 dark:text-red-400",
      };
    default:
      throw new Error(`Unknown task priority: ${priority satisfies never}`);
  }
};

export const formatTaskStatus = (status: TaskStatus) => {
  switch (status) {
    case "backlog":
      return {
        label: "Backlog",
        icon: CircleDashedIcon,
        textColor: "text-destructive",
        borderColor: "border-destructive/75",
        bgColor: "bg-destructive/15",
      };
    case "completed":
      return {
        label: "Completed",
        icon: CircleCheckIcon,
        textColor: "text-emerald-600",
        borderColor: "border-emerald-400/75 dark:border-emerald-600/75",
        bgColor: "bg-emerald-400/15 dark:bg-emerald-600/15",
      };
    case "in_progress":
      return {
        label: "In progress",
        icon: CircleDotIcon,
        textColor: "text-amber-600",
        borderColor: "border-amber-400/75 dark:border-amber-600/75",
        bgColor: "bg-amber-400/15 dark:bg-amber-600/15",
      };
    case "not_started":
      return {
        label: "Not started",
        icon: CircleIcon,
        textColor: "text-muted-foreground",
        borderColor: "border-muted-foreground/75",
        bgColor: "bg-muted-foreground/15",
      };
    default:
      throw new Error(`Unknown task status: ${status satisfies never}`);
  }
};

export const getTaskPriorityBadgeClasses = (priority: TaskPriority) => {
  switch (priority) {
    case "low":
      return "bg-emerald-500/20 border-emerald-500/75 text-emerald-500";
    case "medium":
      return "bg-yellow-500/20 border-yellow-500/75 text-yellow-500";
    case "high":
      return "bg-orange-500/20 border-orange-500/75 text-orange-500";
    case "urgent":
      return "bg-destructive/20 border-destructive/75 text-destructive";
    default:
      throw new Error(`Unknown task priority: ${priority satisfies never}`);
  }
};

export const formatDayTasksSortByOption = (option: DayTasksSortByOption) => {
  switch (option) {
    case "name_a_z":
      return "Name A - Z";
    case "name_z_a":
      return "Name Z - A";
    case "oldest":
      return "Oldest";
    case "priority":
      return "Priority";
    case "recently_created":
      return "Recently created";
    default:
      throw new Error(
        `Unknown day tasks sort by option: ${option satisfies never}`,
      );
  }
};
