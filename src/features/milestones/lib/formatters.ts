import { MilestoneStatus } from "@/db/shared";
import { CheckCircle2Icon, CircleDotIcon, CircleIcon } from "lucide-react";

export const formatMilestoneStatus = (status: MilestoneStatus) => {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckCircle2Icon,
      };
    case "in-progress":
      return {
        label: "In progress",
        icon: CircleDotIcon,
      };
    case "not_started":
      return {
        label: "Not started",
        icon: CircleIcon,
      };
    default:
      throw new Error(`Unknown milestone status: ${status satisfies never}`);
  }
};
