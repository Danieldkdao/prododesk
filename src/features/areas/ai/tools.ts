import { tool } from "ai";
import { readAreasDb } from "../server/areas";
import {
  createAreaToolSchema,
  deleteAreaToolSchema,
  readAreasToolSchema,
  setAreaArchivedToolSchema,
  updateAreaToolSchema,
} from "./schemas";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import {
  findToolExecutionDb,
  updateToolExecutionDb,
  upsertToolExecutionDb,
} from "@/features/chats/server/tool-executions";
import { GENERAL_ERROR_MESSAGE } from "@/lib/constants";
import {
  createAreaAction,
  deleteAreaAction,
  toggleAreaArchiveStatusAction,
  updateAreaAction,
} from "../actions/actions";

const readAreasTool = tool({
  description: "Allows you to read the current user's areas.",
  inputSchema: readAreasToolSchema,
  execute: async (
    { areaIds, includeArchived, search, limit },
    { abortSignal },
  ) => {
    abortSignal?.throwIfAborted();

    const response = await readAreasDb({
      areaIds,
      archiveStatus: includeArchived ? "all" : "active",
      search,
      limit,
    });
    if (!response) throw new Error("Something went wrong. Please try again.");

    return JSON.stringify(response.areas);
  },
});

const createAreaTool = tool({
  description: "Allows you to create an area in the user's workspace.",
  inputSchema: createAreaToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (areaDetails, { context, toolCallId, abortSignal }) => {
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
        toolName: "createArea",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await createAreaAction(areaDetails);

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
        toolName: "createArea",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const updateAreaTool = tool({
  description: "Allows you to update one of the user's areas.",
  inputSchema: updateAreaToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { areaId, changes },
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
        toolName: "updateArea",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();

      const response = await updateAreaAction(areaId, changes);

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
        toolName: "updateArea",
        output: errorMessage,
        status: "failed",
      });
    }
  },
});

const setAreaArchivedTool = tool({
  description:
    "Allows you to change the archive status for one of the user's areas.",
  inputSchema: setAreaArchivedToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { areaId, archived },
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
        toolName: "setAreaArchived",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await toggleAreaArchiveStatusAction(areaId, archived);

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
        toolName: "setAreaArchived",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const deleteAreaTool = tool({
  description: "Allows you to delete one of the user's areas.",
  inputSchema: deleteAreaToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ areaId }, { context, toolCallId, abortSignal }) => {
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
        toolName: "deleteArea",
      });
      if (!insertedToolExecution) throw new Error("Failed to execute tool.");

      abortSignal?.throwIfAborted();
      const response = await deleteAreaAction(areaId);

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
        toolName: "deleteArea",
        output: errorMessage,
        status: "failed",
      });
    }
  },
});

export const areaTools = {
  readAreas: readAreasTool,
  createArea: createAreaTool,
  updateArea: updateAreaTool,
  setAreaArchived: setAreaArchivedTool,
  deleteArea: deleteAreaTool,
};
