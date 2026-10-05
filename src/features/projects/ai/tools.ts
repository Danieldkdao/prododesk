import { tool } from "ai";
import {
  createProjectToolSchema,
  deleteProjectToolSchema,
  readProjectsToolSchema,
  setProjectArchivedToolSchema,
  updateProjectToolSchema,
} from "./schemas";
import { getCurrentUser } from "@/lib/auth/helpers";
import { GENERAL_ERROR_MESSAGE, UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { readProjectsDb } from "../server/projects";
import { parseISO } from "date-fns";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import { executeMutationToolDb } from "@/features/chats/server/tool-executions";
import {
  createProjectAction,
  deleteProjectAction,
  toggleProjectArchiveStatusAction,
  updateProjectAction,
} from "../actions/actions";

const readProjectsTool = tool({
  description: "Allows you to read the user's projects.",
  inputSchema: readProjectsToolSchema,
  execute: async ({ startBefore, ...filterOptions }, { abortSignal }) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();
    const response = await readProjectsDb({
      ...filterOptions,
      archiveStatus: filterOptions.includeArchived ? "all" : "active",
      dateTimeEndRange: startBefore ? parseISO(startBefore) : undefined,
    });
    if (!response) throw new Error(GENERAL_ERROR_MESSAGE);

    return JSON.stringify(response.projects);
  },
});

const createProjectTool = tool({
  description: "Allows you to create a new project for the user.",
  inputSchema: createProjectToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (project, { toolCallId, context, abortSignal }) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "createProject" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await createProjectAction(
          project,
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

const updateProjectTool = tool({
  description: "Allows you to update one of the current user's projects.",
  inputSchema: updateProjectToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { projectId, changes },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateProject" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await updateProjectAction(
          projectId,
          changes,
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

const setProjectArchivedTool = tool({
  description:
    "Allows you to update the archive status of the user's projects.",
  inputSchema: setProjectArchivedToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { projectId, archived },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "setProjectArchived" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await toggleProjectArchiveStatusAction(
          projectId,
          archived,
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

const deleteProjectTool = tool({
  description: "Allows you to delete one of the current user's projects.",
  inputSchema: deleteProjectToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ projectId }, { context, toolCallId, abortSignal }) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "deleteProject" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await deleteProjectAction(projectId, {
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

export const projectTools = {
  readProjects: readProjectsTool,
  createProject: createProjectTool,
  updateProject: updateProjectTool,
  setProjectArchived: setProjectArchivedTool,
  deleteProject: deleteProjectTool,
};
