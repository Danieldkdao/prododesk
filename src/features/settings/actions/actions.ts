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
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

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

export const setPasswordAction = async (newPassword: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const requestHeaders = await headers();

  const accounts = await auth.api.listUserAccounts({
    headers: requestHeaders,
  });
  const alreadyHasPassword = accounts.some(
    (account) => account.providerId === "credential",
  );
  if (alreadyHasPassword) {
    return {
      error: true,
      message: "This account already has a password set.",
    };
  }

  try {
    await auth.api.setPassword({
      body: {
        newPassword,
      },
      headers: requestHeaders,
    });

    return {
      error: false,
      message: "Password set successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const removePasswordAccountAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const requestHeaders = await headers();

  const accounts = await auth.api.listUserAccounts({
    headers: requestHeaders,
  });
  const credentialAccount = accounts.find(
    (account) => account.providerId === "credential",
  );
  if (!credentialAccount) {
    return {
      error: true,
      message: "This account does not have a password.",
    };
  }

  const hasSocialAccounts = accounts.some(
    (account) => account.providerId !== "credential",
  );
  if (!hasSocialAccounts) {
    return {
      error: true,
      message:
        "You cannot remove your password account because you do not have any other social accounts linked. Please link a social account first.",
    };
  }

  try {
    await auth.api.unlinkAccount({
      body: {
        providerId: "credential",
        accountId: credentialAccount.accountId,
      },
      headers: requestHeaders,
    });

    return {
      error: false,
      message: "Password account removed successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
