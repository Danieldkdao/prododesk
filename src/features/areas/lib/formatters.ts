import { AreaStatus } from "@/db/shared";
import { ArchiveIcon, CircleCheckIcon } from "lucide-react";

export const formatAreaStatus = (status: AreaStatus) => {
  switch (status) {
    case "active":
      return {
        text: "Active",
        icon: CircleCheckIcon,
      };
    case "archived":
      return {
        text: "Archived",
        icon: ArchiveIcon,
      };
    default:
      throw new Error(`Unknown area status: ${status satisfies never}`);
  }
};
