"use server";

import { db } from "@/db/db";
import { UploadIntentTable, user as UserTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { GENERAL_ERROR_MESSAGE, UNAUTHED_ERROR_MESSAGE } from "@/lib/constants";
import { and, eq } from "drizzle-orm";
import { deleteFilesFromStorage } from "../lib/delete-files";
import { areValidIds } from "@/lib/utils";

const removePreviousProfileImage = async (
  userId: string,
  key: string | null,
) => {
  if (key?.startsWith(`${userId}/profile-image/`)) {
    await deleteFilesFromStorage([key]);
  }
};

export const completeProfileImageUpload = async ({
  uploadId,
}: {
  uploadId: string;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return { error: true, message: UNAUTHED_ERROR_MESSAGE };
  if (!areValidIds(uploadId))
    return { error: true, message: GENERAL_ERROR_MESSAGE };

  try {
    const previousKey = await db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, userId))
        .for("update");
      const [upload] = await tx
        .select()
        .from(UploadIntentTable)
        .where(
          and(
            eq(UploadIntentTable.id, uploadId),
            eq(UploadIntentTable.userId, userId),
            eq(UploadIntentTable.purpose, "profile_image"),
          ),
        )
        .for("update");
      if (
        !existingUser ||
        !upload?.storageKey.startsWith(`${userId}/profile-image/`)
      ) {
        throw new Error("No owned profile image upload found.");
      }
      await tx
        .update(UserTable)
        .set({ profileImageKey: upload.storageKey })
        .where(eq(UserTable.id, userId));
      await tx
        .delete(UploadIntentTable)
        .where(eq(UploadIntentTable.id, upload.id));
      return existingUser.profileImageKey;
    });

    await removePreviousProfileImage(userId, previousKey);
    return { error: false, message: "Profile image updated successfully." };
  } catch (error) {
    console.error(error);
    return { error: true, message: GENERAL_ERROR_MESSAGE };
  }
};

export const resetProfileImageAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return { error: true, message: UNAUTHED_ERROR_MESSAGE };

  try {
    const previousKey = await db.transaction(async (tx) => {
      const [existingUser] = await tx
        .select()
        .from(UserTable)
        .where(eq(UserTable.id, userId))
        .for("update");
      if (!existingUser) throw new Error("User not found.");
      await tx
        .update(UserTable)
        .set({ profileImageKey: null })
        .where(eq(UserTable.id, userId));
      return existingUser.profileImageKey;
    });
    await removePreviousProfileImage(userId, previousKey);
    return { error: false, message: "Profile image reset successfully." };
  } catch (error) {
    console.error(error);
    return { error: true, message: GENERAL_ERROR_MESSAGE };
  }
};
