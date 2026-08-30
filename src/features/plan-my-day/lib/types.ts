export type PlannerCounts = {
  todayTaskCount: number;
  tasksNeedAttentionCount: number;
  unsortedTaskCount: number;
};

export type PlannerCardState = "clear" | "single" | "triage" | "plan_ready";
export type SingleTaskSource = "today" | "attention" | "unsorted";
