import { ActivityAction, ActivitySource, ActivitySubject } from "@/db/shared";
import {
  EditIcon,
  FileTextIcon,
  FolderKanbanIcon,
  ListCheckIcon,
  MilestoneIcon,
  PenIcon,
  SettingsIcon,
  ShapesIcon,
  SparklesIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";
import { ActivitySortByOption } from "./activity-params";
import { ProjectSelectType } from "@/db/schema";
import { formatDistanceToNow } from "date-fns";

export const formatActivitySource = (source: ActivitySource) => {
  switch (source) {
    case "ai":
      return {
        label: "AI",
        icon: SparklesIcon,
      };
    case "system":
      return {
        label: "System",
        icon: SettingsIcon,
      };
    case "user":
      return {
        label: "You",
        icon: UserIcon,
      };
    default:
      throw new Error(`Unknown activity source: ${source satisfies never}`);
  }
};

export const formatActivityAction = (action: ActivityAction) => {
  switch (action) {
    case "create":
      return {
        label: "Create",
        icon: PenIcon,
      };
    case "delete":
      return {
        label: "Delete",
        icon: Trash2Icon,
      };
    case "update":
      return {
        label: "Update",
        icon: EditIcon,
      };
    default:
      throw new Error(`Unknown activity action: ${action satisfies never}`);
  }
};

export const formatActivitySubject = (subject: ActivitySubject) => {
  switch (subject) {
    case "document":
      return {
        label: "Document",
        icon: FileTextIcon,
      };
    case "milestone":
      return {
        label: "Milestone",
        icon: MilestoneIcon,
      };
    case "project":
      return {
        label: "Project",
        icon: FolderKanbanIcon,
      };
    case "task":
      return {
        label: "Task",
        icon: ListCheckIcon,
      };
    case "area":
      return {
        label: "Area",
        icon: ShapesIcon,
      };
    default:
      throw new Error(`Unknown activity subject: ${subject satisfies never}`);
  }
};

export const formatActivitySortByOption = (option: ActivitySortByOption) => {
  switch (option) {
    case "most_recent":
      return "Most recent";
    case "oldest":
      return "Oldest";
    default:
      throw new Error(
        `Unknown activity sort by option: ${option satisfies never}`,
      );
  }
};

export const formatActivityMessage = ({
  message,
  source,
  createdAt,
  project,
}: {
  message: string;
  source: ActivitySource;
  createdAt: Date;
  project?: ProjectSelectType;
}) => {
  const sourceLabel = formatActivitySource(source).label;
  const formattedMessage = message.at(0)?.toLowerCase() + message.slice(1);
  const timeAgo = formatDistanceToNow(createdAt, {
    includeSeconds: true,
    addSuffix: true,
  });
  const finalMessage = `${sourceLabel} ${formattedMessage} ${project ? `in project "${project.name}"` : ""} ${timeAgo}`;
  return finalMessage;
};
