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
import {
  findToolExecutionDb,
  updateToolExecutionDb,
  upsertToolExecutionDb,
} from "@/features/chats/server/tool-executions";
import {
  createMilestoneAction,
  deleteMilestoneAction,
  moveMilestoneAction,
  updateMilestoneAction,
  updateMilestoneStatusAction,
} from "../actions/actions";
import { db } from "@/db/db";

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
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "createMilestones",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      const projectId = milestones[0]?.projectId;
      if (!projectId) throw new Error("No project ID.");

      const maxPosition = await getMaxMilestonePositionDb(projectId);

      const responses = await db.transaction(async (tx) => {
        const responses = await Promise.all(
          milestones.map((milestone, index) => {
            abortSignal?.throwIfAborted();
            return createMilestoneAction(
              {
                ...milestone,
                position: maxPosition + index + 1,
                dueAt: milestone.dueAt ? parseISO(milestone.dueAt) : undefined,
              },
              "ai",
              tx,
            );
          }),
        );
        if (
          !responses.every(Boolean) ||
          responses.filter((res) => !res.error).length !== milestones.length
        )
          throw new Error("Failed to insert milestones.");

        return responses;
      });

      const isSuccess =
        responses.filter((res) => !res.error).length === milestones.length;
      const output =
        responses.find((res) => res.error)?.message ?? responses.at(0)?.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "createMilestones",
      });
      throw new Error(errorMessage);
    }
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
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateMilestone",
      });
      if (!insertedToolExecution) return null;

      abortSignal?.throwIfAborted();
      const response = await updateMilestoneAction(
        milestoneId,
        {
          ...changes,
          dueAt: changes.dueAt ? parseISO(changes.dueAt) : undefined,
        },
        "ai",
      );

      const isSuccess = !response.error;
      const output = response.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateMilestone",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
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
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output);

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateMilestonesStatus",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      const responses = await Promise.all(
        milestoneIds.map((milestoneId) => {
          abortSignal?.throwIfAborted();
          return updateMilestoneStatusAction(milestoneId, status, "ai");
        }),
      );

      const isSuccess =
        responses.filter((res) => !res.error).length === milestoneIds.length;
      const output =
        responses.find((res) => res.error)?.message ?? responses.at(0)?.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateMilestonesStatus",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
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
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "moveMilestone",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await moveMilestoneAction(
        projectId,
        milestoneId,
        position,
        "ai",
      );
      const isSuccess = !response.error;
      const output = response.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "moveMilestone",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const deleteMilestoneTool = tool({
  description: "Allows you to delete one of the current user's milestones.",
  inputSchema: deleteMilestoneToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ milestoneId }, { context, toolCallId, abortSignal }) => {
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This tool execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "deleteMilestone",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await deleteMilestoneAction(milestoneId, "ai");

      const isSuccess = !response.error;
      const output = response.message;

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "deleteMilestone",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
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
