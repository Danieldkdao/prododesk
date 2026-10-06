import { tool } from "ai";
import {
  createMilestonesToolSchema,
  deleteMilestoneToolSchema,
  moveMilestoneToolSchema,
  readMilestonesToolSchema,
  updateMilestonesStatusToolSchema,
  updateMilestoneToolSchema,
} from "./schemas";
import { getCurrentUser } from "@/lib/auth/helpers";
import { GENERAL_ERROR_MESSAGE, UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import {
  getMaxMilestonePositionDb,
  readMilestonesDb,
} from "../server/milestones";
import { parseISO } from "date-fns";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import { executeMutationToolDb } from "@/features/chats/server/tool-executions";
import {
  createMilestoneAction,
  deleteMilestoneAction,
  moveMilestoneAction,
  updateMilestoneAction,
  updateMilestoneStatusAction,
} from "../actions/actions";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";

const readMilestonesTool = tool({
  description: "Allows you to read the current user's milestones.",
  inputSchema: readMilestonesToolSchema,
  execute: async (
    { dueAfter, dueBefore, ...filterOptions },
    { abortSignal },
  ) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();

    const response = await readMilestonesDb({
      ...filterOptions,
      dueAtOnAfter: dueAfter ? parseISO(dueAfter) : undefined,
      dueAtOnBefore: dueBefore ? parseISO(dueBefore) : undefined,
    });
    if (!response) throw new Error(GENERAL_ERROR_MESSAGE);

    return JSON.stringify(response.milestones);
  },
});

const createMilestonesTool = tool({
  description: "Allows you to create milestones for the user.",
  inputSchema: createMilestonesToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ milestones }, { context, toolCallId, abortSignal }) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "createMilestones" },
      async (tx) => {
        if (
          new Set(milestones.map((milestone) => milestone.projectId)).size !== 1
        )
          throw new Error(
            "You cannot insert milestones from across different projects in the same query.",
          );
        const projectId = milestones[0]?.projectId;
        if (!projectId) throw new Error("No project ID.");
        const { userId } = await getCurrentUser();
        if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);
        const existingProject = await confirmUserProjectOwnership(
          projectId,
          userId,
        );
        if (!existingProject) throw new Error(GENERAL_ERROR_MESSAGE);
        const maxPosition = await getMaxMilestonePositionDb(projectId);
        const responses = await Promise.all(
          milestones.map((milestone, index) => {
            abortSignal?.throwIfAborted();
            return createMilestoneAction(
              {
                ...milestone,
                position: maxPosition + index + 1,
              },
              { source: "ai", chatRunId: context.runId, tx },
            );
          }),
        );
        if (
          !responses.every(Boolean) ||
          responses.filter((res) => !res.error).length !== milestones.length
        )
          throw new Error("Failed to insert milestones.");
        const isSuccess =
          responses.filter((res) => !res.error).length === milestones.length;
        const output =
          responses.find((res) => res.error)?.message ??
          responses.at(0)?.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const updateMilestoneTool = tool({
  description: "Allows you to update one of the user's milestones.",
  inputSchema: updateMilestoneToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { milestoneId, changes },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateMilestone" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await updateMilestoneAction(milestoneId, changes, {
          source: "ai",
          chatRunId: context.runId,
          tx,
        });
        const isSuccess = !response.error;
        const output = response.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const updateMilestonesStatusTool = tool({
  description: "Allows you to update the statuses of the user's milestones.",
  inputSchema: updateMilestonesStatusToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { milestoneIds, status },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateMilestonesStatus" },
      async (tx) => {
        const responses = await Promise.all(
          milestoneIds.map((milestoneId) => {
            abortSignal?.throwIfAborted();
            return updateMilestoneStatusAction(milestoneId, status, {
              source: "ai",
              chatRunId: context.runId,
              tx,
            });
          }),
        );
        const isSuccess =
          responses.filter((res) => !res.error).length === milestoneIds.length;
        const output =
          responses.find((res) => res.error)?.message ??
          responses.at(0)?.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const moveMilestoneTool = tool({
  description:
    "Allows you to update the position of one of the user's milestones.",
  inputSchema: moveMilestoneToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { milestoneId, projectId, position },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "moveMilestone" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await moveMilestoneAction(
          projectId,
          milestoneId,
          position,
          { source: "ai", chatRunId: context.runId, tx },
        );
        const isSuccess = !response.error;
        const output = response.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const deleteMilestoneTool = tool({
  description: "Allows you to delete one of the current user's milestones.",
  inputSchema: deleteMilestoneToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ milestoneId }, { context, toolCallId, abortSignal }) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "deleteMilestone" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await deleteMilestoneAction(milestoneId, {
          source: "ai",
          chatRunId: context.runId,
          tx,
        });
        const isSuccess = !response.error;
        const output = response.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

export const milestoneTools = {
  readMilestones: readMilestonesTool,
  createMilestones: createMilestonesTool,
  updateMilestone: updateMilestoneTool,
  updateMilestonesStatus: updateMilestonesStatusTool,
  moveMilestone: moveMilestoneTool,
  deleteMilestone: deleteMilestoneTool,
};
