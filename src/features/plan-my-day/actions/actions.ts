"use server";

import { db } from "@/db/db";
import { TaskTable } from "@/db/schema";
import { getUserTaskTag } from "@/features/tasks/server/cache/tasks";
import { getCurrentUser } from "@/lib/auth/helpers";
import { getLocalDayBounds } from "@/lib/utils";
import { tz, TZDate } from "@date-fns/tz";
import { format, parse, subDays } from "date-fns";
import { and, count, eq, gte, isNull, lte, or } from "drizzle-orm";
import { cacheTag } from "next/cache";

const readCachedPlanMyDayDataAction = async (
  userId: string,
  timeZone: string,
  date: string,
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const dateToUse = parse(date, "yyyy-MM-dd", TZDate.tz(timeZone), {
    in: tz(timeZone),
  });
  const { startUtc, endUtc } = getLocalDayBounds(dateToUse, timeZone);
  const threeDaysAgo = subDays(startUtc, 3);

  const [[todayTaskCount], [tasksNeedAttentionCount], [unsortedTaskCount]] =
    await Promise.all([
      db
        .select({
          count: count(),
        })
        .from(TaskTable)
        .where(
          and(
            eq(TaskTable.userId, userId),
            or(
              and(
                gte(TaskTable.scheduledAt, startUtc),
                lte(TaskTable.scheduledAt, endUtc),
              ),
              and(gte(TaskTable.dueAt, startUtc), lte(TaskTable.dueAt, endUtc)),
            ),
          ),
        ),
      db
        .select({
          count: count(),
        })
        .from(TaskTable)
        .where(
          and(
            eq(TaskTable.userId, userId),
            or(
              lte(TaskTable.scheduledAt, startUtc),
              lte(TaskTable.dueAt, startUtc),
              and(
                isNull(TaskTable.scheduledAt),
                isNull(TaskTable.dueAt),
                isNull(TaskTable.projectId),
                isNull(TaskTable.milestoneId),
              ),
            ),
          ),
        ),
      db
        .select({
          count: count(),
        })
        .from(TaskTable)
        .where(
          and(
            isNull(TaskTable.scheduledAt),
            isNull(TaskTable.dueAt),
            isNull(TaskTable.projectId),
            isNull(TaskTable.milestoneId),
            lte(TaskTable.createdAt, threeDaysAgo),
          ),
        ),
    ]);

  return {
    todayTaskCount: todayTaskCount.count,
    tasksNeedAttentionCount: tasksNeedAttentionCount.count,
    unsortedTaskCount: unsortedTaskCount.count,
  };
};
export const readPlanMyDayDataAction = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  const today = format(new Date(), "yyyy-MM-dd", {
    in: tz(user.timeZone),
  });

  return readCachedPlanMyDayDataAction(userId, user.timeZone, today);
};
