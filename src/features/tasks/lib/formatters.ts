import { TaskPriority, TaskStatus } from "@/db/shared";
import {
  ChevronDownCircleIcon,
  ChevronUpCircleIcon,
  CircleAlertIcon,
  CircleCheckBigIcon,
  CircleDashed,
  CircleDotIcon,
  InboxIcon,
  MinusCircleIcon,
} from "lucide-react";
import { DayTasksSortByOption } from "./tasks-params";

export const formatTaskPriority = (priority: TaskPriority) => {
  switch (priority) {
    case "low":
      return {
        label: "Low",
        icon: ChevronDownCircleIcon,
      };
    case "medium":
      return {
        label: "Medium",
        icon: MinusCircleIcon,
      };
    case "high":
      return {
        label: "High",
        icon: ChevronUpCircleIcon,
      };
    case "urgent":
      return {
        label: "Urgent",
        icon: CircleAlertIcon,
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
        icon: InboxIcon,
      };
    case "completed":
      return {
        label: "Completed",
        icon: CircleCheckBigIcon,
      };
    case "in_progress":
      return {
        label: "In progress",
        icon: CircleDotIcon,
      };
    case "not_started":
      return {
        label: "Not started",
        icon: CircleDashed,
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
