import {
  findToolExecutionDb,
  updateToolExecutionDb,
  upsertToolExecutionDb,
} from "@/features/chats/server/tool-executions";
import { getCurrentUser } from "@/lib/auth/helpers";
import { GENERAL_ERROR_MESSAGE, UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import { tool } from "ai";
import { parseISO } from "date-fns";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTasksPriorityAction,
  updateTasksStatusAction,
} from "../actions/actions";
import { readTasksDb } from "../server/tasks";
import {
  createTasksToolSchema,
  deleteTaskToolSchema,
  readTasksToolSchema,
  updateTaskToolSchema,
  updateTasksPriorityToolSchema,
  updateTasksStatusToolSchema,
} from "./schemas";

const readTasksTool = tool({
  description: "Allows you to read the user's tasks.",
  inputSchema: readTasksToolSchema,
  execute: async ({ before, after, ...filterOptions }, { abortSignal }) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();

    const response = await readTasksDb({
      ...filterOptions,
      dateTimeStartRange: after ? parseISO(after) : undefined,
      dateTimeEndRange: before ? parseISO(before) : undefined,
    });
    if (!response) throw new Error(GENERAL_ERROR_MESSAGE);

    return JSON.stringify(response.tasks);
  },
});

const createTasksTool = tool({
  description: "Allows you to create new tasks for the user.",
  inputSchema: createTasksToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { tasks },
    { context, toolCallId, abortSignal },
  ): Promise<string> => {
    try {
      if (!tasks.length)
        throw new Error("You submitted an empty array. Please try again.");

      const existingExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingExecution?.status === "pending")
        return "This execution is pending.";
      if (existingExecution?.status === "completed")
        return JSON.stringify(existingExecution.output) ?? "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "createTasks",
      });

      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      const responses = await Promise.all(
        tasks.map((task) => {
          abortSignal?.throwIfAborted();
          return createTaskAction(
            {
              ...task,
              scheduledAt: task.scheduledAt ? parseISO(task.scheduledAt) : null,
              dueAt: task.dueAt ? parseISO(task.dueAt) : null,
            },
            "ai",
          );
        }),
      );

      const isSuccess =
        responses.length === tasks.length &&
        responses.every((response) => !response.error);

      const output =
        (responses.find((res) => res.error)?.message ??
          responses.at(0)?.message) ||
        GENERAL_ERROR_MESSAGE;

      await updateToolExecutionDb(
        insertedToolExecution.runId,
        insertedToolExecution.toolCallId,
        { output, status: isSuccess ? "completed" : "failed" },
      );

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
        toolName: "createTasks",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const updateTaskTool = tool({
  description: "Allows you to update ONE of the user's tasks.",
  inputSchema: updateTaskToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { id, updateFields },
    { context, toolCallId, abortSignal },
  ): Promise<string> => {
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) ?? "No output";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateTask",
      });

      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await updateTaskAction(
        id,
        {
          ...updateFields,
          scheduledAt: updateFields.scheduledAt
            ? parseISO(updateFields.scheduledAt)
            : null,
          dueAt: updateFields.dueAt ? parseISO(updateFields.dueAt) : null,
        },
        "ai",
      );

      const output = response.message;

      await updateToolExecutionDb(
        insertedToolExecution.runId,
        insertedToolExecution.toolCallId,
        {
          output,
          status: response.error ? "failed" : "completed",
        },
      );

      if (response.error) throw new Error(output);
      return output;
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateTask",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const updateTasksStatusTool = tool({
  description: "Allows you to update multiple tasks' statuses.",
  inputSchema: updateTasksStatusToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { ids, newStatus },
    { context, toolCallId, abortSignal },
  ): Promise<string> => {
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) ?? "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateTasksStatus",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await updateTasksStatusAction(ids, newStatus, "ai");

      const isSuccess = !response.error;

      const output = isSuccess
        ? "Tasks updated successfully!"
        : (response.message ?? "Something went wrong. Unable to update tasks.");

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
        toolName: "updateTasksStatus",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const updateTasksPriorityTool = tool({
  description: "Allows you to update multiple tasks' priorities.",
  inputSchema: updateTasksPriorityToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { taskIds, priority },
    { context, toolCallId, abortSignal },
  ) => {
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) || "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "updateTasksPriority",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await updateTasksPriorityAction(taskIds, priority, "ai");

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
        toolName: "updateTasksPriority",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

const deleteTaskTool = tool({
  description: "Allows you to delete ONE of the user's tasks.",
  inputSchema: deleteTaskToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { id },
    { context, toolCallId, abortSignal },
  ): Promise<string> => {
    try {
      const existingToolExecution = await findToolExecutionDb(
        context.runId,
        toolCallId,
      );
      if (existingToolExecution?.status === "pending")
        return "This execution is pending.";
      if (existingToolExecution?.status === "completed")
        return JSON.stringify(existingToolExecution.output) ?? "No output.";

      const insertedToolExecution = await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "deleteTask",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await deleteTaskAction(id, "ai");

      const output = response.message;

      await updateToolExecutionDb(
        insertedToolExecution.runId,
        insertedToolExecution.toolCallId,
        {
          output,
          status: response.error ? "failed" : "completed",
        },
      );

      if (response.error) throw new Error(output);
      return output;
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : GENERAL_ERROR_MESSAGE;
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "deleteTask",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

export const taskTools = {
  readTasks: readTasksTool,
  createTasks: createTasksTool,
  updateTask: updateTaskTool,
  updateTasksStatus: updateTasksStatusTool,
  updateTasksPriority: updateTasksPriorityTool,
  deleteTask: deleteTaskTool,
};
