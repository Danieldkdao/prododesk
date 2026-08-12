import { db, DbTransaction } from "@/db/db";
import { ActivityInsertType, ActivityTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, desc, eq } from "drizzle-orm";
import { revalidateActivityCache } from "./cache/activity";

export const insertActivityDb = async (
  data: Omit<ActivityInsertType, "userId">,
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const lastActivity = await (tx ?? db).query.ActivityTable.findFirst({
    where: and(
      eq(ActivityTable.userId, userId),
      eq(ActivityTable.projectId, data.projectId ?? ""),
    ),
    orderBy: desc(ActivityTable.createdAt),
  });

  if (lastActivity?.subjectId === data.subjectId) return lastActivity;

  const [insertedActivity] = await (tx ?? db)
    .insert(ActivityTable)
    .values({ ...data, userId })
    .returning();

  revalidateActivityCache(insertedActivity.userId, insertedActivity.projectId);

  return insertedActivity;
};
