import { getCurrentUser } from "@/lib/auth/helpers";
import { UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { tz } from "@date-fns/tz";
import { tool } from "ai";
import { format } from "date-fns";
import z from "zod";

const getCurrentTimeTool = tool({
  description:
    "Get the current date and time in the user's configured time zone.",
  inputSchema: z.object({}),
  execute: async () => {
    const { user } = await getCurrentUser();
    if (!user) throw new Error(UNAUTHED_ERROR_MESSAGE);

    const now = new Date();
    const timeZone = user.timeZone;

    const returnData = {
      isoUtc: now.toISOString(),
      timeZone,
      localTime: format(now, "PPPPpppp", { in: tz(timeZone) }),
    };

    return JSON.stringify(returnData);
  },
});

export const systemTools = {
  getCurrentTime: getCurrentTimeTool,
};
