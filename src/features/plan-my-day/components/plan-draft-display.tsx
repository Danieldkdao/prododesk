import { Separator } from "@/components/ui/separator";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { cn } from "@/lib/utils";
import {
  ClockIcon,
  DotIcon,
  SparklesIcon,
  SquareCheckBigIcon,
} from "lucide-react";
import { Fragment } from "react";
import { formatEnergyLevel } from "../lib/formatters";
import { EnrichedDailyPlanDraft } from "../lib/types";

export const PlanDraftDisplay = ({
  draft,
}: {
  draft: EnrichedDailyPlanDraft;
}) => {
  const timeAvailable =
    draft.availableMinutes < 60
      ? `${draft.availableMinutes} minutes`
      : `${Math.floor(draft.availableMinutes / 60)} hours`;
  const {
    label: energyLevel,
    icon: EnergyLevelIcon,
    textColor: energyLevelTextColor,
  } = formatEnergyLevel(draft.energyLevel);
  const selectedTaskCount = draft.items.length;

  const gridItems = [
    {
      icon: ClockIcon,
      mainText: timeAvailable,
      sideText: "available",
      iconColor: "text-muted-foreground",
    },
    {
      icon: EnergyLevelIcon,
      mainText: energyLevel,
      sideText: "energy",
      iconColor: energyLevelTextColor,
    },
    {
      icon: SquareCheckBigIcon,
      mainText: `${selectedTaskCount} ${selectedTaskCount === 1 ? "task" : "tasks"}`,
      sideText: "selected",
      iconColor: "text-muted-foreground",
    },
  ];

  return (
    <div className="w-full min-w-0 flex flex-col gap-4 @container">
      <div className="grid grid-cols-2 @xl:grid-cols-3 gap-4">
        {gridItems.map((item, index) => (
          <div key={index} className="bg-accent/60 p-4 flex items-center gap-2">
            <item.icon className={cn("size-4.5 shrink-0", item.iconColor)} />
            <span className="text-base text-muted-foreground">
              <span className="font-medium text-foreground">
                {item.mainText}
              </span>{" "}
              {item.sideText}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-primary/15 p-4 border-l-4 border-l-primary text-primary flex flex-col @xl:flex-row items-start gap-4">
        <SparklesIcon className="shrink-0" />
        <span className="text-lg">{draft.summary}</span>
      </div>
      {draft.items.map((item, index) => {
        const {
          icon: StatusIcon,
          textColor: statusTextColor,
          label: status,
        } = formatTaskStatus(item.task.status);
        const {
          icon: PriorityIcon,
          textColor: priorityTextColor,
          label: priority,
        } = formatTaskPriority(item.task.priority);

        return (
          <Fragment key={item.taskId}>
            <div className="flex items-start gap-4 w-full min-w-0">
              <div className="bg-accent border flex items-center justify-center size-10 shrink-0">
                <span className="text-xl font-semibold">{index + 1}</span>
              </div>
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-xl font-semibold block truncate">
                  {item.task.name}
                </span>
                <p className="text-lg text-muted-foreground line-clamp-2 block">
                  {item.reason}
                </p>
                <div className="flex items-center gap-1 flex-wrap">
                  <div
                    className={cn("flex items-center gap-2", priorityTextColor)}
                  >
                    <PriorityIcon className="size-4.5 shrink-0" />
                    <span className="text-base">{priority}</span>
                  </div>
                  <DotIcon className="text-muted-foreground/50" />
                  <div
                    className={cn("flex items-center gap-2", statusTextColor)}
                  >
                    <StatusIcon className="size-4.5 shrink-0" />
                    <span className="text-base">{status}</span>
                  </div>
                </div>
              </div>
              <div className="bg-accent border flex items-center gap-2 shrink-0 px-2 py-1">
                <ClockIcon className="text-muted-foreground size-4.5" />
                <span className="text-base font-medium text-muted-foreground">
                  {item.estimatedMinutes} min
                </span>
              </div>
            </div>
            <Separator className="last:hidden" />
          </Fragment>
        );
      })}
    </div>
  );
};
