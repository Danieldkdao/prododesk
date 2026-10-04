import { executeMutationToolDb } from "@/features/chats/server/tool-executions";
import { getCurrentUser } from "@/lib/auth/helpers";
import { GENERAL_ERROR_MESSAGE, UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { runIdContextSchema } from "@/services/ai/tools/helpers";
import { tool } from "ai";
import { parseISO } from "date-fns";
import {
  createTaskAction,
  deleteTaskAction,
  updateTaskAction,
  updateTaskMilestoneAction,
  updateTasksPriorityAction,
  updateTasksStatusAction,
} from "../actions/actions";
import { readTasksDb } from "../server/tasks";
import {
  assignTasksToMilestoneToolSchema,
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
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "createTasks" },
      async (tx) => {
        if (!tasks.length)
          throw new Error("You submitted an empty array. Please try again.");
        const responses = await Promise.all(
          tasks.map((task) => {
            abortSignal?.throwIfAborted();
            return createTaskAction(
              {
                ...task,
                scheduledAt: task.scheduledAt
                  ? parseISO(task.scheduledAt)
                  : null,
                dueAt: task.dueAt ? parseISO(task.dueAt) : null,
              },
              { source: "ai", chatRunId: context.runId, tx },
            );
          }),
        );
        const failedResponse = responses.find((response) => response.error);
        if (responses.length !== tasks.length || failedResponse) {
          throw new Error(failedResponse?.message || GENERAL_ERROR_MESSAGE);
        }
        const isSuccess =
          responses.length === tasks.length &&
          responses.every((response) => !response.error);
        const output =
          (responses.find((res) => res.error)?.message ??
            responses.at(0)?.message) ||
          GENERAL_ERROR_MESSAGE;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const updateTaskTool = tool({
  description: "Allows you to update ONE of the user's tasks.",
  inputSchema: updateTaskToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { id, updateFields: { scheduledAt, dueAt, ...changes } },
    { context, toolCallId, abortSignal },
  ): Promise<string> => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateTask" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await updateTaskAction(
          id,
          {
            ...changes,
            scheduledAt:
              typeof scheduledAt === "string"
                ? parseISO(scheduledAt)
                : scheduledAt,
            dueAt: typeof dueAt === "string" ? parseISO(dueAt) : dueAt,
          },
          { source: "ai", chatRunId: context.runId, tx },
        );
        const output = response.message;
        if (response.error) throw new Error(output);
        return output;
      },
    );
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
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateTasksStatus" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await updateTasksStatusAction(ids, newStatus, {
          source: "ai",
          chatRunId: context.runId,
          tx,
        });
        if (response.error) throw new Error(response.message);
        const isSuccess = !response.error;
        const output = isSuccess
          ? "Tasks updated successfully!"
          : (response.message ??
            "Something went wrong. Unable to update tasks.");
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
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
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "updateTasksPriority" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await updateTasksPriorityAction(taskIds, priority, {
          source: "ai",
          chatRunId: context.runId,
          tx,
        });
        if (response.error) throw new Error(response.message);
        const isSuccess = !response.error;
        const output = response.message;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
  },
});

const assignTasksToMilestoneTool = tool({
  description: "Allows you to assign or unassign tasks to a milestone.",
  inputSchema: assignTasksToMilestoneToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { taskIds, milestoneId },
    { context, toolCallId, abortSignal },
  ) => {
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "assignTasksToMilestone" },
      async (tx) => {
        const responses = await Promise.all(
          taskIds.map((taskId) => {
            abortSignal?.throwIfAborted();
            return updateTaskMilestoneAction(taskId, milestoneId ?? null, {
              source: "ai",
              chatRunId: context.runId,
              tx,
            });
          }),
        );
        const failedResponse = responses.find((response) => response.error);
        if (failedResponse) throw new Error(failedResponse.message);
        const isSuccess =
          responses.filter((res) => !res.error).length === taskIds.length;
        const output =
          responses.find((res) => res.error)?.message ??
          responses.at(0)?.message ??
          GENERAL_ERROR_MESSAGE;
        if (isSuccess) return output;
        throw new Error(output);
      },
    );
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
    return executeMutationToolDb(
      { runId: context.runId, toolCallId, toolName: "deleteTask" },
      async (tx) => {
        abortSignal?.throwIfAborted();
        const response = await deleteTaskAction(id, {
          source: "ai",
          chatRunId: context.runId,
          tx,
        });
        const output = response.message;
        if (response.error) throw new Error(output);
        return output;
      },
    );
  },
});

export const taskTools = {
  readTasks: readTasksTool,
  createTasks: createTasksTool,
  updateTask: updateTaskTool,
  updateTasksStatus: updateTasksStatusTool,
  updateTasksPriority: updateTasksPriorityTool,
  assignTasksToMilestone: assignTasksToMilestoneTool,
  deleteTask: deleteTaskTool,
};
