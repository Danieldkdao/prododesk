import { MilestoneStatus } from "@/db/shared";
import { CheckSquare2Icon, SquareDotIcon, SquareIcon } from "lucide-react";

export const formatMilestoneStatus = (status: MilestoneStatus) => {
  switch (status) {
    case "completed":
      return {
        label: "Completed",
        icon: CheckSquare2Icon,
        textColor: "text-emerald-700 dark:text-emerald-400",
        borderColor: "border-emerald-300 dark:border-emerald-800",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      };

    case "in-progress":
      return {
        label: "In progress",
        icon: SquareDotIcon,
        textColor: "text-primary",
        borderColor: "border-primary/80",
        bgColor: "bg-primary/10",
      };

    case "not_started":
      return {
        label: "Not started",
        icon: SquareIcon,
        textColor: "text-muted-foreground",
        borderColor: "border-muted-foreground/80",
        bgColor: "bg-muted-foreground/10",
      };

    default:
      throw new Error(`Unknown milestone status: ${status satisfies never}`);
  }
};
