import { db } from "@/db/db";
import { TaskTable } from "@/db/schema";
import {
  findToolExecutionDb,
  upsertToolExecutionDb,
  updateToolExecutionDb,
} from "@/features/chats/server/tool-executions";
import { getCurrentUser } from "@/lib/auth/helpers";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import { tool } from "ai";
import { parseISO } from "date-fns";
import { and, eq, inArray, ilike, lte, gte } from "drizzle-orm";
import { format } from "date-fns";
import {
  createTaskAction,
  updateTaskAction,
  updateTasksStatusAction,
  deleteTaskAction,
} from "../actions/actions";
import { formatTaskStatus } from "../lib/formatters";
import {
  readTasksToolSchema,
  createTasksToolSchema,
  updateTaskToolSchema,
  updateTasksStatusToolSchema,
  deleteTaskToolSchema,
} from "./schemas";

export const readTasksTool = tool({
  description: "Allows you to read the user's tasks.",
  inputSchema: readTasksToolSchema,
  execute: async (
    { before, after, statuses, priorities, search },
    { abortSignal },
  ) => {
    abortSignal?.throwIfAborted();

    const { userId } = await getCurrentUser();
    if (!userId)
      throw new Error(
        "This user is not authenticated. Tell them they need to sign in.",
      );

    const tasks = await db
      .select()
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          before ? lte(TaskTable.scheduledAt, parseISO(before)) : undefined,
          after ? gte(TaskTable.scheduledAt, parseISO(after)) : undefined,
          statuses.length ? inArray(TaskTable.status, statuses) : undefined,
          priorities.length
            ? inArray(TaskTable.priority, priorities)
            : undefined,
          search?.trim()
            ? ilike(TaskTable.name, `%${search.trim()}%`)
            : undefined,
        ),
      );

    return tasks
      .map(
        (task) =>
          `ID: ${task.id}\n
           NAME: ${task.name}\n
           DESCRIPTION: ${task.description}\n
           EMOJI: ${task.emoji}\n
           PRIORITY: ${task.priority}\n
           STATUS: ${formatTaskStatus(task.status)}\n
           SCHEDULED AT: ${task.scheduledAt ? format(task.scheduledAt, "PPpp") : "NONE"}\n
           DUE AT: ${task.dueAt ? format(task.dueAt, "PPpp") : "NONE"}\n
           CREATED AT: ${format(task.createdAt, "PPpp")}`,
      )
      .join("\n\n");
  },
});

export const createTasksTool = tool({
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
          return createTaskAction({
            ...task,
            scheduledAt: task.scheduledAt ? parseISO(task.scheduledAt) : null,
            dueAt: task.dueAt ? parseISO(task.dueAt) : null,
          });
        }),
      );

      const isSuccess = responses.every((response) => !response.error);

      const output = isSuccess
        ? "Success! Tasks created successfully!"
        : (responses.at(0)?.message ??
          "An error occurred. Unable to create all tasks.");

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
        : "Something went wrong. Please try again.";
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

export const updateTaskTool = tool({
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
      const response = await updateTaskAction(id, {
        ...updateFields,
        scheduledAt: updateFields.scheduledAt
          ? parseISO(updateFields.scheduledAt)
          : null,
        dueAt: updateFields.dueAt ? parseISO(updateFields.dueAt) : null,
      });

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
        : "Something went wrong. Please try again.";
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

export const updateTasksStatusTool = tool({
  description: "Allows you to mark tasks as complete/uncomplete.",
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
        toolName: "toggleTasksCompletionStatus",
      });
      if (!insertedToolExecution)
        throw new Error("Failed to execute tool. Please try again.");

      abortSignal?.throwIfAborted();
      const response = await updateTasksStatusAction(ids, newStatus);

      const isSuccess = !response.error;

      const output = isSuccess
        ? "Tasks updated successfully!"
        : (response.message ?? "Something went wrong. Unable to update tasks.");

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (isSuccess) return output;
      else throw new Error(output);
    } catch (error) {
      console.error(error);
      const errorMessage = Error.isError(error)
        ? error.message
        : "Something went wrong. Please try again.";
      await upsertToolExecutionDb({
        runId: context.runId,
        toolCallId,
        toolName: "toggleTasksCompletionStatus",
        output: errorMessage,
        status: "failed",
      });
      throw new Error(errorMessage);
    }
  },
});

export const deleteTaskTool = tool({
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
      const response = await deleteTaskAction(id);

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
        : "Something went wrong. Please try again.";
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
  deleteTask: deleteTaskTool,
};
