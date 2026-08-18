import {
  FileTextIcon,
  FolderKanbanIcon,
  ListCheckIcon,
  MessageSquareMoreIcon,
  MilestoneIcon,
  ShapesIcon,
} from "lucide-react";
import { label } from "motion/react-m";

export const GENERAL_ERROR_MESSAGE =
  "Something went wrong. Please try again or come back later.";
export const UNAUTHED_ERROR_MESSAGE = "Please sign in to continue.";
export const INVALID_DATA_ERROR_MESSAGE = "Invalid data. Please try again.";
export const NO_PERMISSION_DATA_MESSAGE =
  "You do not have permission to do this.";
export const NOT_FOUND_ERROR_MESSAGE = "Resource not found.";

export const DEFAULT_PAGE = 1;
export const PAGE_SIZE = 20;

export const resources = [
  {
    value: "areas",
    label: "Areas",
    icon: ShapesIcon,
  },
  {
    value: "projects",
    label: "Projects",
    icon: FolderKanbanIcon,
  },
  {
    value: "tasks",
    label: "Tasks",
    icon: ListCheckIcon,
  },
  {
    value: "milestones",
    label: "Milestones",
    icon: MilestoneIcon,
  },
  {
    value: "documents",
    label: "Documents",
    icon: FileTextIcon,
  },
  {
    value: "chats",
    label: "Chats",
    icon: MessageSquareMoreIcon,
  },
] as const;
