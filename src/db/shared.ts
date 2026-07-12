import { pgEnum } from "drizzle-orm/pg-core";

export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export type TaskPriority = (typeof taskPriorities)[number];
export const taskPriorityEnum = pgEnum("task_priorities", taskPriorities);
