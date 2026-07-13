import { TaskPriority } from "@/db/shared";
import {
  DayTasksSchedule,
  DayTasksSortByOption,
  DayTasksStatus,
} from "./day-tasks-params";

export const formatTaskPriority = (priority: TaskPriority) => {
  switch (priority) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "urgent":
      return "Urgent";
    default:
      throw new Error(`Unknown task priority: ${priority satisfies never}`);
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
    case "recently_completed":
      return "Recently completed";
    case "recently_created":
      return "Recently created";
    default:
      throw new Error(
        `Unknown day tasks sort by option: ${option satisfies never}`,
      );
  }
};

export const formatDayTasksStatus = (status: DayTasksStatus) => {
  switch (status) {
    case "active":
      return "Active";
    case "all":
      return "All";
    case "complete":
      return "Complete";
    default:
      throw new Error(`Unknown day tasks status: ${status satisfies never}`);
  }
};

export const formatDayTasksSchedule = (schedule: DayTasksSchedule) => {
  switch (schedule) {
    case "any":
      return "Any";
    case "scheduled":
      return "Scheduled";
    case "unscheduled":
      return "Unscheduled";
    default:
      throw new Error(
        `Unknown day tasks schedule: ${schedule satisfies never}`,
      );
  }
};
