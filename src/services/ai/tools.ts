import { envServer } from "@/data/env/server";
import { db } from "@/db/db";
import { TaskTable } from "@/db/schema";
import {
  findToolExecutionDb,
  upsertToolExecutionDb,
  updateToolExecutionDb,
} from "@/features/chats/server/tool-executions";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskCompletionAction,
  updateTaskAction,
} from "@/features/tasks/actions/actions";
import { getCurrentUser } from "@/lib/auth/helpers";
import { tool } from "ai";
import { format, parse } from "date-fns";
import { and, eq, ilike, inArray } from "drizzle-orm";
import z from "zod";
import {
  runIdContextSchema,
  createTasksToolSchema,
  deleteTaskToolSchema,
  readTasksToolSchema,
  scrapeWebpageToolSchema,
  scrapeWebpageToolValidationSchema,
  searchWebToolSchema,
  searchWebToolValidationSchema,
  toggleTasksCompletionStatusToolSchema,
  updateTaskToolSchema,
} from "./schemas";
import { ChatToolSet, ToolName } from "./tool-contracts";
import removeMd from "remove-markdown";

const searchWebTool = tool({
  description: "Searches the web and returns search results.",
  inputSchema: searchWebToolSchema,
  execute: async ({ query }, { abortSignal }) => {
    const userId = await getCurrentUser();
    if (!userId)
      throw new Error(
        "This user is not authenticated. Tell them they need to sign in first.",
      );

    const response = await fetch(
      "https://ai.hackclub.com/proxy/v1/exa/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${envServer.HACK_CLUB_AI_API_KEY}`,
        },
        body: JSON.stringify({ query, numResults: 5 }),
        signal: abortSignal,
      },
    );
    const unparsedData = await response.json();
    const { data, success } =
      searchWebToolValidationSchema.safeParse(unparsedData);
    if (!success) throw new Error("Invalid response data. Please try again.");

    return data.results
      .map(
        (result) => `
      ID: ${result.id}
      TITLE: ${result.title}
      URL: ${result.url}\n\n
      `,
      )
      .join("");
  },
});

const scrapeWebpageTool = tool({
  description: "Scrapes given webpage and returns clean information.",
  inputSchema: scrapeWebpageToolSchema,
  execute: async ({ url }, { abortSignal }) => {
    const userId = await getCurrentUser();
    if (!userId)
      throw new Error(
        "This user is not authenticated. Tell them they need to sign in first.",
      );

    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${envServer.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: [{ type: "markdown" }],
        onlyMainContent: true,
        minAge: 123,
        waitFor: 0,
        skipTlsVerification: true,
        parsers: ["pdf"],
        actions: [{ type: "wait", milliseconds: 2 }],
        location: { country: "US", languages: ["en-US"] },
        removeBase64Images: true,
        blockAds: true,
        proxy: "auto",
        storeInCache: true,
        lockdown: false,
        redactPII: false,
        zeroDataRetention: false,
      }),
      signal: abortSignal,
    });
    const unparsedData = await response.json();
    const { data, success } =
      scrapeWebpageToolValidationSchema.safeParse(unparsedData);
    if (!success) throw new Error("Invalid response data. Please try again.");

    const normalText = removeMd(data.data.markdown);

    return normalText;
  },
});

const readTasksTool = tool({
  description: "Allows you to read the user's tasks.",
  inputSchema: readTasksToolSchema,
  execute: async ({ day, priorities, search }, { abortSignal }) => {
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
          day ? eq(TaskTable.day, day) : undefined,
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
          `ID: ${task.id}\nDAY: ${task.day}\nNAME: ${task.name}\nDESCRIPTION: ${task.description}\nEMOJI: ${task.emoji}\nPRIORITY: ${task.priority}\nSTART AT: ${task.startAt ? format(task.startAt, "p") : "NO SPECIFIED"}\nEND AT: ${task.endAt ? format(task.endAt, "p") : "NOT SPECIFIED"}\nIS COMPLETED: ${task.isCompleted ? "YES" : "NO"}\nCOMPLETED AT: ${task.completedAt ? format(task.completedAt, "PPpp") : "NOT COMPLETED"}\nCREATED AT: ${format(task.createdAt, "PPpp")}`,
      )
      .join("\n\n");
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
          return createTaskAction({
            ...task,
            range: {
              from: parse(task.range.from, "yyyy-MM-dd", new Date()),
              to: task.range.to
                ? parse(task.range.to, "yyyy-MM-dd", new Date())
                : undefined,
            },
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
      const response = await updateTaskAction(id, {
        ...updateFields,
        range: {
          from: parse(updateFields.rangeFrom, "yyyy-MM-dd", new Date()),
          to: undefined,
        },
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

const toggleTasksCompletionStatusTool = tool({
  description: "Allows you to mark tasks as complete/uncomplete.",
  inputSchema: toggleTasksCompletionStatusToolSchema,
  contextSchema: runIdContextSchema,
  execute: async (
    { ids },
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

      const responses = await Promise.all(
        ids.map((id) => {
          abortSignal?.throwIfAborted();
          return toggleTaskCompletionAction(id);
        }),
      );

      const isSuccess = responses.every((response) => !response.error);

      const output = isSuccess
        ? "Tasks updated successfully!"
        : (responses.at(0)?.message ??
          "Something went wrong. Unable to update tasks.");

      await updateToolExecutionDb(context.runId, toolCallId, {
        output,
        status: isSuccess ? "completed" : "failed",
      });

      if (responses.every((response) => !response.error)) return output;
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

const getCurrentTimeTool = tool({
  description: "Allows you to get the current system time.",
  inputSchema: z.object({}),
  execute: async () => {
    const date = new Date();
    return format(date, "PPPPpppp");
  },
});

export const tools = {
  searchWeb: searchWebTool,
  scrapeWebpage: scrapeWebpageTool,
  readTasks: readTasksTool,
  createTasks: createTasksTool,
  updateTask: updateTaskTool,
  deleteTask: deleteTaskTool,
  getCurrentTime: getCurrentTimeTool,
  toggleTasksCompletionStatus: toggleTasksCompletionStatusTool,
} satisfies ChatToolSet;
export const toolNames = Object.keys(tools) as ToolName[];
