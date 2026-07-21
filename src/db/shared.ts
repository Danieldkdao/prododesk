import { modelIds } from "@/services/ai/models";
import { pgEnum } from "drizzle-orm/pg-core";

export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof taskPriorities)[number];
export const taskPriorityEnum = pgEnum("task_priorities", taskPriorities);

export const chatRoles = ["user", "assistant"] as const;
export type ChatRole = (typeof chatRoles)[number];
export const chatRoleEnum = pgEnum("chat_roles", chatRoles);

export const modelIdEnum = pgEnum("model_ids", modelIds);

export const toolCallResults = ["finished", "error"] as const;
export type ToolCallResult = (typeof toolCallResults)[number];

export const chatRunStatuses = [
  "pending",
  "streaming",
  "awaiting-approval",
  "running-tool",
  "completed",
  "failed",
  "cancelled",
] as const;
export type ChatRunStatus = (typeof chatRunStatuses)[number];
export const chatRunStatusEnum = pgEnum("chat_run_statuses", chatRunStatuses);

export const toolExecutionStatuses = [
  "pending",
  "completed",
  "failed",
] as const;
export type ToolExecutionStatus = (typeof toolExecutionStatuses)[number];
export const ToolExecutionStatusEnum = pgEnum(
  "tool_execution_statuses",
  toolExecutionStatuses,
);
