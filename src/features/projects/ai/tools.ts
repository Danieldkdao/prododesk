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
import {
  findToolExecutionDb,
  updateToolExecutionDb,
  upsertToolExecutionDb,
} from "@/features/chats/server/tool-executions";
import {
  createProjectAction,
  deleteProjectAction,
  toggleProjectArchiveStatusAction,
  updateProjectAction,
} from "../actions/actions";

const readProjectsTool = tool({
  description: "Allows you to read the user's projects.",
  inputSchema: readProjectsToolSchema,
  execute: async (filterOptions, { abortSignal }) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();
    const response = await readProjectsDb({
      ...filterOptions,
      archiveStatus: filterOptions.includeArchived ? "all" : "active",
      dateTimeEndRange: filterOptions.startBefore
        ? parseISO(filterOptions.startBefore)
        : undefined,
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
        toolName: "createProject",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await createProjectAction(
        {
          ...project,
          startAt: project.startAt ? parseISO(project.startAt) : undefined,
          endAt: project.endAt ? parseISO(project.endAt) : undefined,
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
        toolName: "createProject",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
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
        toolName: "updateProject",
      });
      if (insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await updateProjectAction(
        projectId,
        {
          ...changes,
          startAt: changes.startAt ? parseISO(changes.startAt) : undefined,
          endAt: changes.endAt ? parseISO(changes.endAt) : undefined,
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
        toolName: "updateProject",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
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
        toolName: "setProjectArchived",
      });
      if (!insertedToolExecution) throw new Error("Failed to execute tool.");

      abortSignal?.throwIfAborted();
      const response = await toggleProjectArchiveStatusAction(
        projectId,
        archived,
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
        toolName: "setProjectArchived",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const deleteProjectTool = tool({
  description: "Allows you to delete one of the current user's projects.",
  inputSchema: deleteProjectToolSchema,
  contextSchema: runIdContextSchema,
  execute: async ({ projectId }, { context, toolCallId, abortSignal }) => {
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
        toolName: "deleteProject",
      });
      if (!insertedToolExecution) throw new Error("Failed to execute tool.");

      abortSignal?.throwIfAborted();
      const response = await deleteProjectAction(projectId, "ai");

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
        toolName: "deleteProject",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

export const projectTools = {
  readProjects: readProjectsTool,
  createProject: createProjectTool,
  updateProject: updateProjectTool,
  setProjectArchived: setProjectArchivedTool,
  deleteProject: deleteProjectTool,
};
