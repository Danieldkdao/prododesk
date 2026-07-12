import { TaskPriority } from "@/db/shared";

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
