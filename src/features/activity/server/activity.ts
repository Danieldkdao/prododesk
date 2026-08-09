import { db, DbTransaction } from "@/db/db";
import { ActivityInsertType, ActivityTable } from "@/db/schema";
import { revalidateActivityCache } from "./cache/activity";
import { getCurrentUser } from "@/lib/auth/helpers";

export const insertActivityDb = async (
  data: Omit<ActivityInsertType, "userId">,
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [insertedActivity] = await (tx ?? db)
    .insert(ActivityTable)
    .values({ ...data, userId })
    .returning();

  revalidateActivityCache(insertedActivity.userId, insertedActivity.projectId);

  return insertedActivity;
};
