import { modelIds } from "@/services/ai/model-ids";
import { toolNames } from "@/services/ai/tool-contracts";
import { pgEnum } from "drizzle-orm/pg-core";

export const taskStatuses = [
  "backlog",
  "not_started",
  "in_progress",
  "completed",
] as const;
export type TaskStatus = (typeof taskStatuses)[number];
export const taskStatusEnum = pgEnum("task_statuses", taskStatuses);

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

export const colors = [
  "cyan",
  "pink",
  "blue",
  "green",
  "purple",
  "rose",
  "orange",
  "amber",
  "slate",
  "stone",
] as const;
export type Color = (typeof colors)[number];
export const colorEnum = pgEnum("colors", colors);

export const projectStatuses = [
  "planned",
  "active",
  "on_hold",
  "completed",
  "cancelled",
] as const;
export type ProjectStatus = (typeof projectStatuses)[number];
export const projectStatusEnum = pgEnum("project_statuses", projectStatuses);

export const milestoneStatuses = [
  "not_started",
  "in-progress",
  "completed",
] as const;
export type MilestoneStatus = (typeof milestoneStatuses)[number];
export const milestoneStatusEnum = pgEnum(
  "milestone_statuses",
  milestoneStatuses,
);

export const activitySources = ["user", "ai", "system"] as const;
export type ActivitySource = (typeof activitySources)[number];
export const activitySourceEnum = pgEnum("activity_sources", activitySources);

export const activitySubjects = [
  "project",
  "task",
  "milestone",
  "document",
  "area",
] as const;
export type ActivitySubject = (typeof activitySubjects)[number];
export const activitySubjectEnum = pgEnum(
  "activity_subjects",
  activitySubjects,
);

export const activityActions = ["create", "update", "delete"] as const;
export type ActivityAction = (typeof activityActions)[number];
export const activityActionEnum = pgEnum("activity_actions", activityActions);

export const toolNameEnum = pgEnum("tool_names", toolNames);
