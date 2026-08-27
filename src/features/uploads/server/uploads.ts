import { db, DbTransaction } from "@/db/db";
import { UploadIntentInsertType, UploadIntentTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq } from "drizzle-orm";

export const confirmUserUploadIntentOwnership = async (
  uploadId: string,
  userId?: string,
) => {
  const userIdToUse = userId ? userId : (await getCurrentUser()).userId;
  if (!userIdToUse) return null;

  const [existingUploadIntent] = await db
    .select()
    .from(UploadIntentTable)
    .where(
      and(
        eq(UploadIntentTable.id, uploadId),
        eq(UploadIntentTable.userId, userIdToUse),
      ),
    );

  return existingUploadIntent || null;
};

export const insertUploadIntentDb = async (
  uploadIntent: Omit<UploadIntentInsertType, "userId">,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [insertedUploadIntent] = await db
    .insert(UploadIntentTable)
    .values({
      ...uploadIntent,
      userId,
    })
    .returning();

  return insertedUploadIntent || null;
};

export const deleteUploadIntentDb = async (
  uploadId: string,
  tx?: DbTransaction,
) => {
  const existingUploadIntent = await confirmUserUploadIntentOwnership(uploadId);
  if (!existingUploadIntent) return null;

  const [deletedUploadIntent] = await (tx ?? db)
    .delete(UploadIntentTable)
    .where(
      and(
        eq(UploadIntentTable.id, existingUploadIntent.id),
        eq(UploadIntentTable.userId, existingUploadIntent.userId),
      ),
    )
    .returning();

  return deletedUploadIntent || null;
};
