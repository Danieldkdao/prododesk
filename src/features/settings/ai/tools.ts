import { getCurrentUser } from "@/lib/auth/helpers";
import { UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { tool } from "ai";
import z from "zod";
import { readUserProfileAction } from "../actions/actions";

const readUserProfileTool = tool({
  description: "Read the user's profile information.",
  inputSchema: z.object({}),
  execute: async ({}, { abortSignal }) => {
    const { userId } = await getCurrentUser();
    if (!userId) throw new Error(UNAUTHED_ERROR_MESSAGE);

    abortSignal?.throwIfAborted();

    const userProfile = await readUserProfileAction();
    if (!userProfile) throw new Error("User profile not found.");

    return {
      name: userProfile.name,
      description: userProfile.settings?.description ?? "",
      timeZone: userProfile.timeZone,
      userId: userProfile.id,
    };
  },
});

export const settingsTools = {
  readUserProfile: readUserProfileTool,
};
