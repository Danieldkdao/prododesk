import { MilestoneStatus, TaskPriority, TaskStatus } from "@/db/shared";
import { taskViewTabs } from "./constants";
import { TaskSelectType } from "@/db/schema";

export type BoardProperty = Extract<
  keyof TaskSelectType,
  "status" | "priority"
>;

export type TaskFormDefaultValues = {
  day?: Date | null;
  project?: { id: string; name: string; icon?: string | null } | null;
  milestone?: { id: string; name: string; status: MilestoneStatus } | null;
  status?: TaskStatus | null;
  priority?: TaskPriority | null;
};

export type TaskViewTab = (typeof taskViewTabs)[number];

export type TaskBoardColumnValue = TaskSelectType[BoardProperty];
export type PaginationCursor = {
  createdAt: Date;
  id: string;
};
