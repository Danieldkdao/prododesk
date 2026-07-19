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
