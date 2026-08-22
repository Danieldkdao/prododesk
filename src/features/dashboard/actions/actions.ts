"use server";

import { db } from "@/db/db";
import { MilestoneTable, ProjectTable, TaskTable } from "@/db/schema";
import { readActivityDb } from "@/features/activity/server/activity";
import { getUserActivityTag } from "@/features/activity/server/cache/activity";
import { readProjectsDb } from "@/features/projects/server/projects";
import { getUserTaskTag } from "@/features/tasks/server/cache/tasks";
import { getCurrentUser } from "@/lib/auth/helpers";
import { getLocalDayBounds } from "@/lib/utils";
import { parse } from "date-fns";
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  gte,
  isNull,
  lte,
  ne,
  or,
} from "drizzle-orm";
import { cacheTag } from "next/cache";

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

const readCachedDateTasksAction = async (
  userId: string,
  timeZone: string,
  date?: string,
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const dateToUse = date ? parse(date, "yyyy-MM-dd", new Date()) : new Date();
  const { startUtc, endUtc } = getLocalDayBounds(dateToUse, timeZone);

  const todayTasks = await db
    .select({
      ...getTableColumns(TaskTable),
      project: getTableColumns(ProjectTable),
      milestone: getTableColumns(MilestoneTable),
    })
    .from(TaskTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, TaskTable.projectId))
    .leftJoin(MilestoneTable, eq(MilestoneTable.id, TaskTable.milestoneId))
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
    )
    .orderBy(
      asc(TaskTable.scheduledAt),
      asc(TaskTable.dueAt),
      asc(TaskTable.id),
    );

  return todayTasks;
};
export const readDateTasksAction = async (date?: string) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedDateTasksAction(userId, user.timeZone, date);
};

const readCachedDashboardProjectsAction = async (userId: string) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const response = await readProjectsDb({
    userId,
    limit: 3,
    archiveStatus: "active",
  });
  if (!response) return null;
  const { projects } = response;

  return projects;
};
export const readDashboardProjectsAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedDashboardProjectsAction(userId);
};

const readCachedDashboardActivityAction = async (userId: string) => {
  "use cache";
  cacheTag(getUserActivityTag(userId));

  const response = await readActivityDb({
    userId,
    limit: 5,
  });
  if (!response) return null;

  const { activity } = response;
  return activity;
};

export const readDashboardActivityAction = async () => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedDashboardActivityAction(userId);
};
