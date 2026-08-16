import { ToolName } from "@/services/ai/tool-contracts";
import { ChatTools } from "@/services/ai/types";
import { ChatDataParts } from "@/services/ai/types";
import { getToolName, isToolUIPart, UIMessagePart } from "ai";
import {
  ActivityIcon,
  ArchiveIcon,
  BadgePlusIcon,
  BookOpenIcon,
  BrainIcon,
  CircleCheckBigIcon,
  ClockIcon,
  EditIcon,
  FilePenLineIcon,
  FilePlus2Icon,
  FilesIcon,
  FileTextIcon,
  FileX2Icon,
  FlagOffIcon,
  FolderPenIcon,
  FolderPlusIcon,
  FolderSearchIcon,
  FolderXIcon,
  GoalIcon,
  ListChecksIcon,
  ListPlusIcon,
  MoveVerticalIcon,
  PenIcon,
  ScanSearchIcon,
  SearchIcon,
  ShapesIcon,
  SlidersHorizontalIcon,
  Trash2Icon,
} from "lucide-react";

export const formatToolNameForChat = (toolName: ToolName) => {
  switch (toolName) {
    case "createTasks":
      return {
        preparing: "create tasks",
        finished: "creating tasks",
        error: "Create tasks",
        icon: PenIcon,
      };
    case "deleteTask":
      return {
        preparing: "delete task",
        finished: "deleting task",
        error: "Delete task",
        icon: Trash2Icon,
      };
    case "getCurrentTime":
      return {
        preparing: "get current time",
        finished: "get current time",
        error: "Get current time",
        icon: ClockIcon,
      };
    case "readTasks":
      return {
        preparing: "read tasks",
        finished: "reading tasks",
        error: "Read tasks",
        icon: BookOpenIcon,
      };
    case "scrapeWebpage":
      return {
        preparing: "scrape webpage",
        finished: "scraping webpage",
        error: "Scrape webpage",
        icon: ScanSearchIcon,
      };
    case "searchWeb":
      return {
        preparing: "web search",
        finished: "searching the web",
        error: "Web search",
        icon: SearchIcon,
      };
    case "updateTask":
      return {
        preparing: "update task",
        finished: "updating task",
        error: "Update task",
        icon: EditIcon,
      };
    case "updateTasksStatus":
      return {
        preparing: "update tasks status",
        finished: "updating tasks status",
        error: "Update tasks status",
        icon: ListChecksIcon,
      };
    case "updateTasksPriority":
      return {
        preparing: "update tasks priority",
        finished: "updating tasks priority",
        error: "Update tasks priority",
        icon: SlidersHorizontalIcon,
      };
    case "assignTasksToMilestone":
      return {
        preparing: "assign tasks to a milestone",
        finished: "assigning tasks to a milestone",
        error: "Assign tasks to milestone",
        icon: GoalIcon,
      };
    case "readAreas":
      return {
        preparing: "read areas",
        finished: "reading areas",
        error: "Read areas",
        icon: ShapesIcon,
      };
    case "createArea":
      return {
        preparing: "create area",
        finished: "creating an area",
        error: "Create area",
        icon: BadgePlusIcon,
      };
    case "updateArea":
      return {
        preparing: "update area",
        finished: "updating an area",
        error: "Update area",
        icon: EditIcon,
      };
    case "setAreaArchived":
      return {
        preparing: "change area archive status",
        finished: "changing an area's archive status",
        error: "Change area archive status",
        icon: ArchiveIcon,
      };
    case "deleteArea":
      return {
        preparing: "delete area",
        finished: "deleting an area",
        error: "Delete area",
        icon: Trash2Icon,
      };
    case "readProjects":
      return {
        preparing: "read projects",
        finished: "reading projects",
        error: "Read projects",
        icon: FolderSearchIcon,
      };
    case "createProject":
      return {
        preparing: "create project",
        finished: "creating a project",
        error: "Create project",
        icon: FolderPlusIcon,
      };
    case "updateProject":
      return {
        preparing: "update project",
        finished: "updating a project",
        error: "Update project",
        icon: FolderPenIcon,
      };
    case "setProjectArchived":
      return {
        preparing: "change project archive status",
        finished: "changing a project's archive status",
        error: "Change project archive status",
        icon: ArchiveIcon,
      };
    case "deleteProject":
      return {
        preparing: "delete project",
        finished: "deleting a project",
        error: "Delete project",
        icon: FolderXIcon,
      };
    case "readDocuments":
      return {
        preparing: "read documents",
        finished: "reading documents",
        error: "Read documents",
        icon: FilesIcon,
      };
    case "readDocument":
      return {
        preparing: "read document",
        finished: "reading a document",
        error: "Read document",
        icon: FileTextIcon,
      };
    case "createDocument":
      return {
        preparing: "create document",
        finished: "creating a document",
        error: "Create document",
        icon: FilePlus2Icon,
      };
    case "updateDocument":
      return {
        preparing: "update document",
        finished: "updating a document",
        error: "Update document",
        icon: FilePenLineIcon,
      };
    case "deleteDocument":
      return {
        preparing: "delete document",
        finished: "deleting a document",
        error: "Delete document",
        icon: FileX2Icon,
      };
    case "readMilestones":
      return {
        preparing: "read milestones",
        finished: "reading milestones",
        error: "Read milestones",
        icon: GoalIcon,
      };
    case "createMilestones":
      return {
        preparing: "create milestones",
        finished: "creating milestones",
        error: "Create milestones",
        icon: ListPlusIcon,
      };
    case "updateMilestone":
      return {
        preparing: "update milestone",
        finished: "updating a milestone",
        error: "Update milestone",
        icon: EditIcon,
      };
    case "updateMilestonesStatus":
      return {
        preparing: "update milestones status",
        finished: "updating milestones status",
        error: "Update milestones status",
        icon: CircleCheckBigIcon,
      };
    case "moveMilestone":
      return {
        preparing: "move milestone",
        finished: "moving a milestone",
        error: "Move milestone",
        icon: MoveVerticalIcon,
      };
    case "deleteMilestone":
      return {
        preparing: "delete milestone",
        finished: "deleting a milestone",
        error: "Delete milestone",
        icon: FlagOffIcon,
      };
    case "readActivity":
      return {
        preparing: "read activity",
        finished: "reading activity",
        error: "Read activity",
        icon: ActivityIcon,
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

export const formatCurrentAction = (
  part: UIMessagePart<ChatDataParts, ChatTools> | undefined,
) => {
  const defaultData = {
    icon: BrainIcon,
    text: "Thinking",
  };
  if (!part || part.type === "reasoning") return defaultData;

  if (isToolUIPart(part)) {
    const toolName = getToolName(part) as ToolName;

    const { finished, icon } = formatToolNameForChat(toolName);

    return {
      icon,
      text: finished.at(0)?.toUpperCase() + finished.slice(1),
    };
  }

  return defaultData;
};
