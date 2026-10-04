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
import { executeMutationToolDb } from "@/features/chats/server/tool-executions";
import { GENERAL_ERROR_MESSAGE, UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import {
  createAreaAction,
  deleteAreaAction,
  toggleAreaArchiveStatusAction,
  updateAreaAction,
} from "../actions/actions";
import { getCurrentUser } from "@/lib/auth/helpers";

const readAreasTool = tool({
  description: "Allows you to read the current user's areas.",
  inputSchema: readAreasToolSchema,
  execute: async (
    { areaIds, includeArchived, search, limit },
    { abortSignal },
  ) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();

    const response = await readAreasDb({
      areaIds,
      archiveStatus: includeArchived ? "all" : "active",
      search,
      limit,
    });
    if (!response) throw new Error(GENERAL_ERROR_MESSAGE);

    return JSON.stringify(response.areas);
  },
});

const createAreaTool = tool({
  description: "Allows you to create an area in the user's workspace.",
  inputSchema: createAreaToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (areaDetails, { context, toolCallId, abortSignal }) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "createArea" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await createAreaAction(areaDetails, {
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

const updateAreaTool = tool({
  description: "Allows you to update one of the user's areas.",
  inputSchema: updateAreaToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { areaId, changes },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateArea" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await updateAreaAction(areaId, changes, {
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

const setAreaArchivedTool = tool({
  description:
    "Allows you to change the archive status for one of the user's areas.",
  inputSchema: setAreaArchivedToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { areaId, archived },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "setAreaArchived" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await toggleAreaArchiveStatusAction(areaId, archived, {
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

const deleteAreaTool = tool({
  description: "Allows you to delete one of the user's areas.",
  inputSchema: deleteAreaToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ areaId }, { context, toolCallId, abortSignal }) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "deleteArea" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await deleteAreaAction(areaId, {
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

export const areaTools = {
  readAreas: readAreasTool,
  createArea: createAreaTool,
  updateArea: updateAreaTool,
  setAreaArchived: setAreaArchivedTool,
  deleteArea: deleteAreaTool,
};
