"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import {
  confirmUserUploadIntentOwnership,
  deleteUploadIntentDb,
} from "../server/uploads";
import { deleteFilesFromStorage } from "../lib/delete-files";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

export const completeProfileImageUpload = async ({
  uploadId,
}: {
  uploadId: string;
}) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingUploadIntent = await confirmUserUploadIntentOwnership(
    uploadId,
    userId,
  );
  if (!existingUploadIntent) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const previousProfileImageKey = user.profileImageKey;

    await auth.api.updateUser({
      body: {
        profileImageKey: existingUploadIntent.storageKey,
      },
      headers: await headers(),
    });

    const deletedUploadIntent = await deleteUploadIntentDb(
      existingUploadIntent.id,
    );
    if (!deletedUploadIntent) {
      return {
        error: true,
        message: GENERAL_ERROR_MESSAGE,
      };
    }

    if (previousProfileImageKey) {
      const deleteSuccess = await deleteFilesFromStorage([
        previousProfileImageKey,
      ]);
      if (!deleteSuccess) {
        return {
          error: true,
          message: GENERAL_ERROR_MESSAGE,
        };
      }
    }

    return {
      error: false,
      message: "Profile image updated successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }
};
