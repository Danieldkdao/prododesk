import { confirmUserChatOwnership } from "@/features/chats/server/chats";
import {
  confirmUserDocumentOwnership,
  insertDocumentAssetDb,
} from "@/features/documents/server/documents";
import {
  UploadContextSchemaType,
  uploadPayloadSchema,
  UploadPayloadSchemaType,
} from "@/features/uploads/actions/schemas";
import { UPLOAD_LIMITS } from "@/features/uploads/lib/constants";
import { validateFile } from "@/features/uploads/lib/helpers";
import {
  CreateUploadResponse,
  UploadRecordData,
  UploadRecordOutput,
} from "@/features/uploads/lib/types";
import { insertUploadIntentDb } from "@/features/uploads/server/uploads";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { generateFileUrl } from "@/lib/utils";
import { getUploadPresignedUrl } from "@/services/tigris/presigns";
import { NextRequest, NextResponse } from "next/server";

const checkUserPermissions = async (
  payload: UploadContextSchemaType,
): Promise<
  | { error: false; userId: string }
  | { error: true; message: string; status: number }
> => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
      status: 401,
    };
  }

  const returnOnSuccess = {
    error: false as const,
    userId,
  };

  const payloadPurpose = payload.purpose;

  switch (payloadPurpose) {
    case "document-image": {
      if (!payload.documentId) {
        return {
          error: true,
          message: INVALID_DATA_ERROR_MESSAGE,
          status: 400,
        };
      }

      const existingDocument = await confirmUserDocumentOwnership(
        payload.documentId,
        userId,
      );
      if (!existingDocument) {
        return {
          error: true,
          message: NOT_FOUND_ERROR_MESSAGE,
          status: 404,
        };
      }

      return returnOnSuccess;
    }
    case "chat-attachment": {
      if (payload.chatId) {
        const existingChat = await confirmUserChatOwnership(payload.chatId);
        if (!existingChat) {
          return {
            error: true,
            message: NOT_FOUND_ERROR_MESSAGE,
            status: 404,
          };
        }
      }

      return returnOnSuccess;
    }
    case "profile-image": {
      return returnOnSuccess;
    }
    default: {
      throw new Error(
        `Unknown payload purpose: ${payloadPurpose satisfies never}`,
      );
    }
  }
};

const createUploadRecord = async (
  data: UploadRecordData,
): Promise<UploadRecordOutput> => {
  const purpose = data.purpose;

  switch (purpose) {
    case "document-image": {
      const insertedDocumentAsset = await insertDocumentAssetDb(
        data.documentAsset,
      );
      if (!insertedDocumentAsset) {
        throw new Error("Failed to insert document asset");
      }
      return {
        purpose,
        assetId: insertedDocumentAsset.id,
      };
    }
    case "chat-attachment":
    case "profile-image": {
      const insertedUploadIntent = await insertUploadIntentDb(
        data.uploadIntent,
      );
      if (!insertedUploadIntent) {
        throw new Error("Failed to insert upload intent");
      }
      return {
        purpose,
        uploadId: insertedUploadIntent.id,
      };
    }
    default: {
      throw new Error(`Unknown purpose: ${purpose satisfies never}`);
    }
  }
};

export const POST = async (request: NextRequest) => {
  const unsafePayload: UploadPayloadSchemaType = await request.json();

  const { data, success } = uploadPayloadSchema.safeParse(unsafePayload);
  if (!success) {
    return NextResponse.json(
      {
        error: true,
        message: INVALID_DATA_ERROR_MESSAGE,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const purpose = data.purpose;

    const { fileName, fileType, fileSize, ...rest } = data;

    const permissionCheckResult = await checkUserPermissions(rest);
    if (permissionCheckResult.error) {
      return NextResponse.json(
        {
          error: true,
          message: permissionCheckResult.message,
        },
        {
          status: permissionCheckResult.status,
        },
      );
    }

    const userId = permissionCheckResult.userId;

    const accept = UPLOAD_LIMITS[rest.purpose].accept;
    const maxFileSize = UPLOAD_LIMITS[rest.purpose].maxSize;

    const { isValid, reason } = validateFile(
      { size: fileSize, type: fileType, name: fileName },
      {
        accept,
        maxFileSizeBytes: maxFileSize,
      },
    );
    if (!isValid) {
      return NextResponse.json(
        {
          error: true,
          message: reason || INVALID_DATA_ERROR_MESSAGE,
        },
        { status: 400 },
      );
    }

    const uploadId = crypto.randomUUID();

    const storageKey = `${userId}/${purpose}/${uploadId}-${fileName}`;

    let uploadRecordData: UploadRecordData;
    switch (purpose) {
      case "document-image":
        uploadRecordData = {
          purpose,
          documentAsset: {
            userId,
            documentId: data.documentId,
            storageKey,
          },
        };
        break;
      case "chat-attachment":
        uploadRecordData = {
          purpose,
          uploadIntent: {
            userId,
            purpose: "chat_attachment",
            storageKey,
          },
        };
        break;
      case "profile-image":
        uploadRecordData = {
          purpose,
          uploadIntent: {
            userId,
            purpose: "profile_image",
            storageKey,
          },
        };
        break;
      default:
        return NextResponse.json(
          {
            error: true,
            message: INVALID_DATA_ERROR_MESSAGE,
          },
          { status: 400 },
        );
    }
    if (!uploadRecordData)
      throw new Error("Failed to create upload record data.");

    const uploadRecord = await createUploadRecord(uploadRecordData);

    const presignedUrl = await getUploadPresignedUrl(storageKey);
    if (!presignedUrl) {
      return NextResponse.json({
        error: true,
        message: GENERAL_ERROR_MESSAGE,
      });
    }

    let responseData: CreateUploadResponse;
    switch (uploadRecord.purpose) {
      case "document-image":
        responseData = {
          ...uploadRecord,
          publicUrl: generateFileUrl(storageKey),
          uploadUrl: presignedUrl,
        };
        break;
      case "chat-attachment":
        responseData = {
          ...uploadRecord,
          publicUrl: generateFileUrl(storageKey),
          uploadUrl: presignedUrl,
        };
        break;
      case "profile-image":
        responseData = {
          purpose: uploadRecord.purpose,
          uploadId: uploadRecord.uploadId,
          uploadUrl: presignedUrl,
        };
        break;
      default:
        return NextResponse.json(
          {
            error: true,
            message: INVALID_DATA_ERROR_MESSAGE,
          },
          { status: 400 },
        );
    }

    return NextResponse.json({
      error: false,
      message: "Presigned URL generated successfully!",
      data: responseData,
    });
  } catch (error) {
    console.error(error);
    const errorMessage = Error.isError(error)
      ? error.message
      : GENERAL_ERROR_MESSAGE;
    return NextResponse.json(
      {
        error: true,
        message: errorMessage,
      },
      {
        status: 500,
      },
    );
  }
};
