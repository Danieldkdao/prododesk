import { ToolName } from "@/services/ai/tool-contracts";
import {
  BookOpenIcon,
  ClockIcon,
  EditIcon,
  ListChecksIcon,
  PenIcon,
  ScanSearchIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";

export const formatToolNameForChat = (toolName: ToolName) => {
  switch (toolName) {
    case "createTasks":
      return {
        running: "create tasks",
        finished: "creating tasks",
        error: "Create tasks",
        icon: PenIcon,
      };
    case "deleteTask":
      return {
        running: "delete task",
        finished: "deleting task",
        error: "Delete task",
        icon: Trash2Icon,
      };
    case "getCurrentTime":
      return {
        running: "get current time",
        finished: "get current time",
        error: "Get current time",
        icon: ClockIcon,
      };
    case "readTasks":
      return {
        running: "read tasks",
        finished: "reading tasks",
        error: "Read tasks",
        icon: BookOpenIcon,
      };
    case "scrapeWebpage":
      return {
        running: "scrape webpage",
        finished: "scraping webpage",
        error: "Scrape webpage",
        icon: ScanSearchIcon,
      };
    case "searchWeb":
      return {
        running: "web search",
        finished: "searching the web",
        error: "Web search",
        icon: SearchIcon,
      };
    case "updateTask":
      return {
        running: "update task",
        finished: "updating task",
        error: "Update task",
        icon: EditIcon,
      };
    case "toggleTasksCompletionStatus":
      return {
        running: "update tasks completion status",
        finished: "updating tasks completion status",
        error: "Update tasks completion status",
        icon: ListChecksIcon,
      };
    default:
      throw new Error(`Unknown tool name: ${toolName satisfies never}`);
  }
};

export const getApprovalReason = (input: unknown) => {
  if (
    typeof input === "object" &&
    input !== null &&
    "approvalReason" in input &&
    typeof input.approvalReason === "string"
  ) {
    return input.approvalReason;
  }

  return "This action needs your approval.";
};
