import { ProjectStatus } from "@/db/shared";
import {
  BanIcon,
  CircleCheckIcon,
  CirclePlayIcon,
  ClipboardListIcon,
  PauseCircleIcon,
} from "lucide-react";

export const formatProjectStatus = (status: ProjectStatus) => {
  switch (status) {
    case "active":
      return {
        text: "Active",
        icon: CirclePlayIcon,
        bgColor: "bg-blue-500/10",
        textColor: "text-blue-600 dark:text-blue-400",
        borderColor: "border-blue-500/30",
      };
    case "cancelled":
      return {
        text: "Cancelled",
        icon: BanIcon,
        bgColor: "bg-red-500/10",
        textColor: "text-red-600 dark:text-red-400",
        borderColor: "border-red-500/30",
      };
    case "completed":
      return {
        text: "Completed",
        icon: CircleCheckIcon,
        bgColor: "bg-green-500/10",
        textColor: "text-green-600 dark:text-green-400",
        borderColor: "border-green-500/30",
      };
    case "on_hold":
      return {
        text: "On hold",
        icon: PauseCircleIcon,
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-500/30",
      };
    case "planned":
      return {
        text: "Planned",
        icon: ClipboardListIcon,
        bgColor: "bg-slate-500/10",
        textColor: "text-slate-600 dark:text-slate-400",
        borderColor: "border-slate-500/30",
      };
    default:
      throw new Error(`Unknown project status: ${status satisfies never}`);
  }
};
