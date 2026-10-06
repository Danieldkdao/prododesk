import { deleteUploadRequestSchema } from "@/features/uploads/actions/schemas";
import { deleteFilesFromStorage } from "@/features/uploads/lib/delete-files";
import { db } from "@/db/db";
import { UploadIntentTable } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export const DELETE = async (request: NextRequest) => {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { error: true, message: UNAUTHED_ERROR_MESSAGE },
        { status: 401 },
      );
    }
    const parsed = deleteUploadRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: true, message: INVALID_DATA_ERROR_MESSAGE },
        { status: 400 },
      );
    }
    await db.transaction(async (tx) => {
      const [upload] = await tx
        .select()
        .from(UploadIntentTable)
        .where(
          and(
            eq(UploadIntentTable.id, parsed.data.uploadId),
            eq(UploadIntentTable.userId, userId),
          ),
        )
        .for("update");
      if (!upload) return;
      if (!upload.storageKey.startsWith(`${userId}/`)) {
        throw new Error("Invalid storage ownership.");
      }
      if (!(await deleteFilesFromStorage([upload.storageKey]))) {
        throw new Error("Failed to delete file from storage.");
      }
      await tx
        .delete(UploadIntentTable)
        .where(
          and(
            eq(UploadIntentTable.id, upload.id),
            eq(UploadIntentTable.userId, userId),
          ),
        );
    });
    return NextResponse.json({
      error: false,
      message: "File deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: true, message: GENERAL_ERROR_MESSAGE },
      { status: 500 },
    );
  }
};
