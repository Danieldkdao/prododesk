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
      day?: string;
      search?: string | null;
      priorities: Array<"low" | "medium" | "high" | "urgent">;
    };
    output: string;
  };
  createTasks: {
    input: {
      tasks: Array<{
        name: string;
        priority: "low" | "medium" | "high" | "urgent";
        description?: string | null;
        emoji?: string | null;
        startAt?: string | null;
        endAt?: string | null;
        range: {
          from: string;
          to?: string;
        };
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
        priority: "low" | "medium" | "high" | "urgent";
        description?: string | null;
        emoji?: string | null;
        startAt?: string | null;
        endAt?: string | null;
        rangeFrom: string;
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
  toggleTasksCompletionStatus: {
    input: {
      ids: string[];
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
