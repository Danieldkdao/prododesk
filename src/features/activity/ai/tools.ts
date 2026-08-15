import { tool } from "ai";
import { readActivityToolSchema } from "./schemas";
import { getCurrentUser } from "@/lib/auth/helpers";
import { UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { readActivityDb } from "../server/activity";
import { parseISO } from "date-fns";

const readActivityTool = tool({
  description: "Allows you to read the user's activity in their workspace.",
  inputSchema: readActivityToolSchema,
  execute: async ({ after, before, ...filterOptions }, { abortSignal }) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    const response = await readActivityDb({
      ...filterOptions,
      after: after ? parseISO(after) : undefined,
      before: before ? parseISO(before) : undefined,
    });
    if (!response) return null;

    return JSON.stringify(response.activity);
  },
});

export const activityTools = {
  readActivity: readActivityTool,
};
