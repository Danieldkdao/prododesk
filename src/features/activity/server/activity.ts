import { db, DbTransaction } from "@/db/db";
import { ActivityInsertType, ActivityTable } from "@/db/schema";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, desc, eq } from "drizzle-orm";
import { revalidateActivityCache } from "./cache/activity";

export const insertActivityDb = async (
  data: Omit<ActivityInsertType, "userId">,
  tx?: DbTransaction,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingProject = data.projectId
    ? await confirmUserProjectOwnership(data.projectId)
    : null;
  if (data.projectId && !existingProject) return null;

  const lastActivity = await (tx ?? db).query.ActivityTable.findFirst({
    where: and(
      eq(ActivityTable.userId, userId),
      data.projectId ? eq(ActivityTable.projectId, data.projectId) : undefined,
      data.areaId ? eq(ActivityTable.areaId, data.areaId) : undefined,
      data.subjectId ? eq(ActivityTable.subjectId, data.subjectId) : undefined,
      eq(ActivityTable.action, data.action),
      eq(ActivityTable.source, data.source),
      eq(ActivityTable.subject, data.subject),
    ),
    orderBy: desc(ActivityTable.createdAt),
  });

  if (lastActivity) return lastActivity;

  const [insertedActivity] = await (tx ?? db)
    .insert(ActivityTable)
    .values({ ...data, userId })
    .returning();
  if (!insertedActivity) return null;

  revalidateActivityCache(
    insertedActivity.userId,
    insertedActivity.projectId,
    existingProject?.areaId ?? insertedActivity.areaId,
  );

  return insertedActivity;
};
