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
      };
    case "cancelled":
      return {
        text: "Cancelled",
        icon: BanIcon,
      };
    case "completed":
      return {
        text: "Completed",
        icon: CircleCheckIcon,
      };
    case "on_hold":
      return {
        text: "On hold",
        icon: PauseCircleIcon,
      };
    case "planned":
      return {
        text: "Planned",
        icon: ClipboardListIcon,
      };
    default:
      throw new Error(`Unknown project status: ${status satisfies never}`);
  }
};
