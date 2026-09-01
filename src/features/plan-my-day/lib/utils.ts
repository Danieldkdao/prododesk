import { PlannerCardState, PlannerCounts, SingleTaskSource } from "./types";

export type GetPlannerCardStateReturnType = {
  [S in PlannerCardState]: S extends "single"
    ? {
        state: S;
        source: SingleTaskSource;
      }
    : { state: S };
}[PlannerCardState];

export const getPlannerCardState = ({
  todayTaskCount,
  tasksNeedAttentionCount,
  unsortedTaskCount,
}: PlannerCounts): GetPlannerCardStateReturnType => {
  const actionableTaskCount = todayTaskCount + tasksNeedAttentionCount;

  const totalCandidateCount = actionableTaskCount + unsortedTaskCount;

  if (totalCandidateCount === 0)
    return {
      state: "clear" as const,
    };
  if (totalCandidateCount === 1) {
    let singleTaskSource: SingleTaskSource = "today";
    switch (true) {
      case todayTaskCount === 1:
        singleTaskSource = "today";
        break;
      case tasksNeedAttentionCount === 1:
        singleTaskSource = "attention";
        break;
      case unsortedTaskCount === 1:
        singleTaskSource = "unsorted";
        break;
      default:
        throw new Error("This case should not be possible.");
    }

    return {
      state: "single" as const,
      source: singleTaskSource,
    };
  }
  if (actionableTaskCount === 0) {
    return {
      state: "triage" as const,
    };
  }

  return {
    state: "plan_ready" as const,
  };
};
