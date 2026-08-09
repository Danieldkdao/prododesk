import { ActivityAction, ActivitySource, ActivitySubject } from "@/db/shared";
import {
  EditIcon,
  FileTextIcon,
  FolderKanbanIcon,
  ListCheckIcon,
  MilestoneIcon,
  PenIcon,
  SettingsIcon,
  SparklesIcon,
  Trash2Icon,
  UserIcon,
} from "lucide-react";

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
    default:
      throw new Error(`Unknown activity subject: ${subject satisfies never}`);
  }
};
