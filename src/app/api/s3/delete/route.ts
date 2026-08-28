import {
  deleteUploadRequestSchema,
  DeleteUploadRequestSchemaType,
} from "@/features/uploads/actions/schemas";
import {
  confirmUserUploadIntentOwnership,
  deleteUploadIntentDb,
} from "@/features/uploads/server/uploads";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { isError } from "@/lib/utils";
import { getDeletePresignedUrl } from "@/services/tigris/presigns";
import { NextRequest, NextResponse } from "next/server";

const checkUserPermissions = async (
  payload: DeleteUploadRequestSchemaType,
): Promise<
  | { error: true; message: string; status: number }
  | { error: false; userId: string; storageKey: string }
> => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
      status: 401,
    };
  }

  const purpose = payload.purpose;

  switch (purpose) {
    case "upload-intent": {
      if (!payload.uploadId) {
        return {
          error: true,
          message: INVALID_DATA_ERROR_MESSAGE,
          status: 400,
        };
      }
      const existingUploadIntent = await confirmUserUploadIntentOwnership(
        payload.uploadId,
        userId,
      );
      if (!existingUploadIntent) {
        return {
          error: true,
          message: NOT_FOUND_ERROR_MESSAGE,
          status: 404,
        };
      }

      return {
        error: false,
        userId,
        storageKey: existingUploadIntent.storageKey,
      };
    }
    default: {
      throw new Error(`Unknown purpose: ${purpose satisfies never}`);
    }
  }
};

const performDeleteCleanup = async (payload: DeleteUploadRequestSchemaType) => {
  const purpose = payload.purpose;

  switch (purpose) {
    case "upload-intent": {
      const deletedUploadIntent = await deleteUploadIntentDb(payload.uploadId);
      if (!deletedUploadIntent) throw new Error(GENERAL_ERROR_MESSAGE);

      break;
    }
    default: {
      throw new Error(`Unknown purpose: ${purpose satisfies never}`);
    }
  }
};

export const DELETE = async (request: NextRequest) => {
  const unsafePayload: DeleteUploadRequestSchemaType = await request.json();

  const { data, success } = deleteUploadRequestSchema.safeParse(unsafePayload);
  if (!success) {
    return NextResponse.json(
      {
        error: true,
        message: INVALID_DATA_ERROR_MESSAGE,
      },
      { status: 400 },
    );
  }

  try {
    const permissionCheckResult = await checkUserPermissions(data);
    if (permissionCheckResult.error) {
      return NextResponse.json(
        {
          error: true,
          message: permissionCheckResult.message,
        },
        { status: permissionCheckResult.status },
      );
    }

    const storageKey = permissionCheckResult.storageKey;

    const presignedUrl = await getDeletePresignedUrl(storageKey);
    if (!presignedUrl) {
      return NextResponse.json({
        error: true,
        message: GENERAL_ERROR_MESSAGE,
      });
    }

    await performDeleteCleanup(data);

    return NextResponse.json({
      error: false,
      message: "Presigned URL generated successfully!",
      data: { url: presignedUrl },
    });
  } catch (error) {
    console.error(error);
    const errorMessage = isError(error)
      ? error.message
      : GENERAL_ERROR_MESSAGE;
    return NextResponse.json(
      {
        error: true,
        message: errorMessage,
      },
      { status: 500 },
    );
  }
};
