"use server";

import { db } from "@/db/db";
import { SettingsTable, user } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { eq } from "drizzle-orm";
import { profileSchema, ProfileSchemaType } from "./schemas";

export const readUserProfileAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: {
      settings: true,
    },
  });

  return existingUser ?? null;
};
export type ReadUserProfileActionReturnType = UnwrapAsync<
  typeof readUserProfileAction
>;

export const updateUserProfileAction = async (
  unsafeData: ProfileSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data, success } = profileSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    await db.transaction(async (tx) => {
      const updatedUser = await tx
        .update(user)
        .set({
          name: data.name,
          email: data.email,
        })
        .where(eq(user.id, userId));
      if (!updatedUser) throw new Error("Failed to update user profile.");

      const updatedSettings = await tx
        .insert(SettingsTable)
        .values({
          userId,
          description: data.description,
        })
        .onConflictDoUpdate({
          target: [SettingsTable.userId],
          set: {
            description: data.description,
          },
        });
      if (!updatedSettings) throw new Error("Failed to update user settings.");
    });

    return {
      error: false,
      message: "Profile updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
