"use server";

import { db } from "@/db/db";
import { ProjectTable, TaskTable } from "@/db/schema";
import { Task } from "@/features/tasks/components/task";
import { getCurrentUser } from "@/lib/auth/helpers";
import { getLocalDayBounds } from "@/lib/utils";
import { and, count, eq, gte, isNull, lte, ne, or } from "drizzle-orm";

export const readDashboardStatsAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const [taskStatusCounts, [overdueTaskCount], [activeProjectCount]] =
    await Promise.all([
      db
        .select({
          status: TaskTable.status,
          count: count(),
        })
        .from(TaskTable)
        .where(eq(TaskTable.userId, userId))
        .groupBy(TaskTable.status),
      db
        .select({
          count: count(),
        })
        .from(TaskTable)
        .where(
          and(
            eq(TaskTable.userId, userId),
            or(
              lte(TaskTable.dueAt, new Date()),
              and(
                isNull(TaskTable.dueAt),
                lte(TaskTable.scheduledAt, new Date()),
              ),
            ),
            ne(TaskTable.status, "completed"),
          ),
        ),
      db
        .select({
          count: count(),
        })
        .from(ProjectTable)
        .where(
          and(
            eq(ProjectTable.userId, userId),
            eq(ProjectTable.status, "active"),
          ),
        ),
    ]);

  return {
    taskStatusCounts,
    overdueTaskCount: overdueTaskCount.count,
    activeProjectCount: activeProjectCount.count,
  };
};

export const readTodayTasksAction = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  const today = new Date();
  const { startUtc, endUtc } = getLocalDayBounds(today, user.timeZone);

  const todayTasks = await db
    .select()
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        or(
          lte(TaskTable.scheduledAt, startUtc),
          lte(TaskTable.dueAt, startUtc),
          gte(TaskTable.scheduledAt, endUtc),
          gte(TaskTable.dueAt, endUtc),
        ),
      ),
    );

  return todayTasks;
};
