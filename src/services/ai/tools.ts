import { envServer } from "@/data/env/server";
import { db } from "@/db/db";
import { TaskTable } from "@/db/schema";
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
import {
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
import z from "zod";
import { ChatToolSet, ToolName } from "./tool-contracts";

const searchWebTool = tool({
  description: "Searches the web and returns search results.",
  inputSchema: searchWebToolSchema,
  execute: async ({ query }) => {
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
  execute: async ({ url }) => {
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
    });
    const unparsedData = await response.json();
    const { data, success } =
      scrapeWebpageToolValidationSchema.safeParse(unparsedData);
    if (!success) throw new Error("Invalid response data. Please try again.");

    return data.data.markdown;
  },
});

const readTasksTool = tool({
  description: "Allows you to read the user's tasks.",
  inputSchema: readTasksToolSchema,
  execute: async ({ day, priorities, search }) => {
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
  execute: async ({ tasks }): Promise<string> => {
    if (!tasks.length) return "You submitted an empty array. Please try again.";
    const responses = await Promise.all(
      tasks.map((task) =>
        createTaskAction({
          ...task,
          range: {
            from: parse(task.range.from, "yyyy-MM-dd", new Date()),
            to: task.range.to
              ? parse(task.range.to, "yyyy-MM-dd", new Date())
              : undefined,
          },
        }),
      ),
    );
    if (responses.every((response) => !response.error)) {
      return "Success! Tasks created successfully!";
    } else {
      throw new Error(
        responses.at(0)?.message ??
          "An error occurred. Unable to create all tasks.",
      );
    }
  },
});

const updateTaskTool = tool({
  description: "Allows you to update ONE of the user's tasks.",
  inputSchema: updateTaskToolSchema,
  execute: async ({ id, updateFields }) => {
    const response = await updateTaskAction(id, {
      ...updateFields,
      range: {
        from: parse(updateFields.rangeFrom, "yyyy-MM-dd", new Date()),
        to: undefined,
      },
    });
    return response.message;
  },
});

const toggleTasksCompletionStatusTool = tool({
  description: "Allows you to mark tasks as complete/uncomplete.",
  inputSchema: toggleTasksCompletionStatusToolSchema,
  execute: async ({ ids }): Promise<string> => {
    const responses = await Promise.all(
      ids.map((id) => toggleTaskCompletionAction(id)),
    );
    if (responses.every((response) => !response.error))
      return "Tasks updated successfully!";
    else throw new Error("Something went wrong. Unable to update tasks.");
  },
});

const deleteTaskTool = tool({
  description: "Allows you to delete ONE of the user's tasks.",
  inputSchema: deleteTaskToolSchema,
  execute: async ({ id }) => {
    const response = await deleteTaskAction(id);
    return response.message;
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
