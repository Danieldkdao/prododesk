import { pgEnum } from "drizzle-orm/pg-core";

export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof taskPriorities)[number];
export const taskPriorityEnum = pgEnum("task_priorities", taskPriorities);

export const chatRoles = ["user", "assistant"] as const;
export type ChatRole = (typeof chatRoles)[number];
export const chatRoleEnum = pgEnum("chat_roles", chatRoles);

export const modelIds = [
  "deepseek/deepseek-v4-pro",
  "qwen/qwen3.6-35b-a3b",
  "z-ai/glm-5.2",
  "minimax/minimax-m3",
  "google/gemini-3.1-flash-lite",
] as const;
export type ModelId = (typeof modelIds)[number];
export const modelIdEnum = pgEnum("model_ids", modelIds);
