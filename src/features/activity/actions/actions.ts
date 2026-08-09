"use server";

import { db } from "@/db/db";
import {
  ActivityAction,
  ActivitySource,
  ActivitySubject,
  ActivityTable,
  ProjectTable,
} from "@/db/schema";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  or,
  SQL,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getProjectActivityTag } from "../server/cache/activity";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { ActivitySortByOption } from "../lib/activity-params";
import { PAGE_SIZE } from "@/lib/constants";

const readCachedProjectActivityAction = async (
  userId: string,
  projectId: string,
  filterOptions: {
    search: string;
    sortBy: ActivitySortByOption;
    sources: ActivitySource[];
    actions: ActivityAction[];
    subjects: ActivitySubject[];
    page: number;
  },
) => {
  "use cache";
  cacheTag(getProjectActivityTag(projectId));

  const { search, sortBy, sources, actions, subjects, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;
  const searchFilter = or(ilike(ActivityTable.message, searchTerm));

  const sortByMap: Record<ActivitySortByOption, SQL<unknown>> = {
    most_recent: desc(ActivityTable.createdAt),
    oldest: asc(ActivityTable.createdAt),
  };
  const sortBySql = sortByMap[sortBy];

  const sourcesFilter = sources.length
    ? inArray(ActivityTable.source, sources)
    : undefined;

  const actionsFilter = actions.length
    ? inArray(ActivityTable.action, actions)
    : undefined;

  const subjectsFilter = subjects.length
    ? inArray(ActivityTable.subject, subjects)
    : undefined;

  const whereQuery = and(
    eq(ActivityTable.userId, userId),
    eq(ActivityTable.projectId, projectId),
    searchFilter,
    sourcesFilter,
    actionsFilter,
    subjectsFilter,
  );

  const activity = await db
    .select({
      ...getTableColumns(ActivityTable),
      project: getTableColumns(ProjectTable),
    })
    .from(ActivityTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, ActivityTable.projectId))
    .where(whereQuery)
    .orderBy(sortBySql)
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalActivity] = await db
    .select({ count: count() })
    .from(ActivityTable)
    .where(whereQuery);

  const totalActivityCount = totalActivity.count;

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalActivityCount;
  const clientKey = JSON.stringify({
    context: {
      projectId,
    },
    filters: filterOptions,
    results: activity.map(({ id, createdAt }) => ({ id, createdAt })),
    hasNextPage,
  });

  return {
    activity,
    metadata: {
      hasPrevPage,
      hasNextPage,
      totalActivityCount,
      clientKey,
    },
  };
};
export const readProjectActivityAction = async (
  projectId: string,
  filterOptions: {
    search: string;
    sortBy: ActivitySortByOption;
    sources: ActivitySource[];
    actions: ActivityAction[];
    subjects: ActivitySubject[];
    page: number;
  },
) => {
  if (!areValidIds(projectId)) return null;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) return null;

  return readCachedProjectActivityAction(
    userId,
    existingProject.id,
    filterOptions,
  );
};
export type ReadProjectActivityActionReturnType = UnwrapAsync<
  typeof readProjectActivityAction
>;
