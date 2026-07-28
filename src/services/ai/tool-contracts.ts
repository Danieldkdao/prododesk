import { TaskPriority, TaskStatus } from "@/db/shared";
import type { Tool, UIMessagePart } from "ai";

export type ChatTools = {
  searchWeb: {
    input: { query: string };
    output: string;
  };
  scrapeWebpage: {
    input: { url: string };
    output: string;
  };
  readTasks: {
    input: {
      before?: string;
      after?: string;
      search?: string | null;
      statuses: TaskStatus[];
      priorities: TaskPriority[];
    };
    output: string;
  };
  createTasks: {
    input: {
      tasks: Array<{
        name: string;
        priority: TaskPriority;
        status: TaskStatus;
        description?: string | null;
        emoji?: string | null;
        scheduledAt?: string | null;
        dueAt?: string | null;
      }>;
      approvalReason: string;
    };
    output: string;
  };
  updateTask: {
    input: {
      id: string;
      updateFields: {
        name: string;
        priority: TaskPriority;
        status: TaskStatus;
        description?: string | null;
        emoji?: string | null;
        scheduledAt?: string | null;
        dueAt?: string | null;
      };
      approvalReason: string;
    };
    output: string;
  };
  deleteTask: {
    input: {
      id: string;
      approvalReason: string;
    };
    output: string;
  };
  getCurrentTime: {
    input: Record<string, never>;
    output: string;
  };
  updateTasksStatus: {
    input: {
      ids: string[];
      newStatus: TaskStatus;
      approvalReason: string;
    };
    output: string;
  };
};

export type ToolName = keyof ChatTools;

export type MessagePart = UIMessagePart<Record<string, never>, ChatTools>;

export type ChatToolSet = {
  [Name in keyof ChatTools]: Tool<
    ChatTools[Name]["input"],
    ChatTools[Name]["output"]
  >;
};
