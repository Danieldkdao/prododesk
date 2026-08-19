import { CommandItem } from "@/components/ui/command";
import { formatProjectStatus } from "@/features/projects/lib/formatters";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import {
  FileTextIcon,
  FolderKanbanIcon,
  ListCheckIcon,
  MessageSquareMoreIcon,
  MilestoneIcon,
  ShapesIcon,
  ClockIcon,
} from "lucide-react";
import { ResourceData, ResourceType } from "./types";
import {
  formatTaskPriority,
  formatTaskStatus,
} from "@/features/tasks/lib/formatters";
import { formatMilestoneStatus } from "@/features/milestones/lib/formatters";
import { parse, format } from "date-fns";

export const formatResource = (resource: ResourceType) => {
  switch (resource) {
    case "areas":
      return {
        label: "Areas",
        icon: ShapesIcon,
      };
    case "chats":
      return {
        label: "Chats",
        icon: MessageSquareMoreIcon,
      };
    case "documents":
      return {
        label: "Documents",
        icon: FileTextIcon,
      };
    case "milestones":
      return {
        label: "Milestones",
        icon: MilestoneIcon,
      };
    case "projects":
      return {
        label: "Projects",
        icon: FolderKanbanIcon,
      };
    case "tasks":
      return {
        label: "Tasks",
        icon: ListCheckIcon,
      };
    default:
      throw new Error(`Unknown resource type: ${resource satisfies never}`);
  }
};

export const getResourceListElement = ({
  resource,
  item,
  onSelect,
}: ResourceData) => {
  const itemClassName =
    "min-w-0 border border-transparent px-3 py-2.5 hover:border-border";
  const iconClassName = "flex size-10 shrink-0 items-center justify-center";

  switch (resource) {
    case "areas":
      const { bgLight: areaBgLight, text: areaText } = formatColor(item.color);
      return (
        <CommandItem
          key={item.id}
          value={item.id}
          className={itemClassName}
          onSelect={() => onSelect(item)}
        >
          <div className={cn(iconClassName, areaBgLight, areaText)}>
            {item.icon ? (
              <span className="shrink-0 text-2xl">{item.icon}</span>
            ) : (
              <ShapesIcon className="size-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-base">{item.name}</p>
            <p
              className={cn(
                "truncate text-muted-foreground",
                !item.description && "italic",
              )}
            >
              {item.description || "No description provided."}
            </p>
          </div>
        </CommandItem>
      );
    case "projects":
      const { bgLight: projectBgLight, text: projectText } = formatColor(
        item.color,
      );
      const { icon: ProjectIcon, textColor: projectTextColor } =
        formatProjectStatus(item.status);
      return (
        <CommandItem
          key={item.id}
          value={item.id}
          className={itemClassName}
          onSelect={() => onSelect(item)}
        >
          <div className={cn(iconClassName, projectBgLight, projectText)}>
            {item.icon ? (
              <span className="shrink-0 text-2xl">{item.icon}</span>
            ) : (
              <FolderKanbanIcon className="size-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-base">{item.name}</p>
            <p
              className={cn(
                "truncate text-sm text-muted-foreground",
                !item.outcome && "italic",
              )}
            >
              {item.outcome || "No outcome provided."}
            </p>
          </div>
          <ProjectIcon className={cn("size-5", projectTextColor)} />
        </CommandItem>
      );
    case "tasks":
      const { icon: TaskStatusIcon, textColor: taskStatusTextColor } =
        formatTaskStatus(item.status);
      const { icon: TaskPriorityIcon, textColor: taskPriorityTextColor } =
        formatTaskPriority(item.priority);

      return (
        <CommandItem
          key={item.id}
          value={item.id}
          className={itemClassName}
          onSelect={() => onSelect(item)}
        >
          <div className={cn(iconClassName, "bg-primary/10")}>
            {item.emoji ? (
              <span className="shrink-0 text-2xl">{item.emoji}</span>
            ) : (
              <FolderKanbanIcon className="size-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 min-w-0">
              <TaskPriorityIcon
                className={cn("size-5", taskPriorityTextColor)}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-base">{item.name}</p>
              </div>
            </div>
            <p className="truncate text-sm text-muted-foreground">
              {item.description}
            </p>
          </div>
          <TaskStatusIcon className={cn("size-5", taskStatusTextColor)} />
        </CommandItem>
      );
    case "milestones":
      const { icon: MilestoneStatusIcon, textColor: milestoneStatusTextColor } =
        formatMilestoneStatus(item.status);
      return (
        <CommandItem
          key={item.id}
          value={item.id}
          className={itemClassName}
          onSelect={() => onSelect(item)}
        >
          <div className={cn(iconClassName, "bg-primary/10 text-primary")}>
            <MilestoneIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-base">{item.name}</p>
            <p className="truncate text-muted-foreground">
              {item.description ||
                (item.dueAt
                  ? `Due ${format(parse(item.dueAt, "yyyy-MM-dd", new Date()), "PP, p")}`
                  : "No due date")}
            </p>
          </div>
          <MilestoneStatusIcon
            className={cn("size-5", milestoneStatusTextColor)}
          />
        </CommandItem>
      );
    case "documents":
      return (
        <CommandItem
          key={item.id}
          value={item.id}
          className={itemClassName}
          onSelect={() => onSelect(item)}
        >
          <div className={cn(iconClassName, "bg-primary/10 text-primary")}>
            <FileTextIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-base">{item.name}</p>
            <div className="min-w-0 flex items-center gap-1.5">
              <ClockIcon className="text-muted-foreground size-4" />
              <p className="text-muted-foreground">
                Last updated at {format(item.updatedAt, "PP, p")}
              </p>
            </div>
          </div>
        </CommandItem>
      );
    case "chats":
      return (
        <CommandItem
          key={item.id}
          value={item.id}
          className={itemClassName}
          onSelect={() => onSelect(item)}
        >
          <div className={cn(iconClassName, "bg-primary/10 text-primary")}>
            <MessageSquareMoreIcon className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-base">{item.name}</p>
            <div className="flex items-center gap-1.5">
              <ClockIcon className="text-muted-foreground size-4" />
              <p className="text-muted-foreground">
                Last message at {format(item.updatedAt, "PP, p")}
              </p>
            </div>
          </div>
        </CommandItem>
      );
    default:
      throw new Error(`Unknown resource type: ${resource satisfies never}`);
  }
};
