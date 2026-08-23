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
import { resetAccountDataDb } from "../server/settings";

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

export const updateUserSettingsAction = async (description?: string | null) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  try {
    const updatedSettings = await db
      .insert(SettingsTable)
      .values({
        userId,
        description,
      })
      .onConflictDoUpdate({
        target: SettingsTable.userId,
        set: {
          description,
        },
      });
    if (!updatedSettings) throw new Error("Failed to update user settings.");

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

export const resetAccountDataAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const deletedData = await resetAccountDataDb();
  if (!deletedData) {
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }

  return {
    error: false,
    message: "Account data reset successfully.",
  };
};
