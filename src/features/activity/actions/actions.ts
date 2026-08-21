"use server";

import { db } from "@/db/db";
import {
  ActivityTable,
  ProjectTable,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import { count, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import {
  getAreaActivityTag,
  getProjectActivityTag,
  getUserActivityTag,
} from "../server/cache/activity";
import { UnwrapAsync } from "@/lib/types";
import { ActivityFilters } from "../lib/activity-params";
import { PAGE_SIZE } from "@/lib/constants";
import { readActivityDb } from "../server/activity";

type ReadActivityFilters = ActivityFilters & {
  projectIds?: string[];
  areaIds?: string[];
};

const readCachedActivityAction = async (
  userId: string,
  filterOptions: ReadActivityFilters,
) => {
  "use cache";

  cacheTag(getUserActivityTag(userId));
  filterOptions.projectIds?.forEach((projectId) => {
    cacheTag(getProjectActivityTag(projectId));
  });
  filterOptions.areaIds?.forEach((areaId) => {
    cacheTag(getAreaActivityTag(areaId));
  });

  const page = filterOptions.page;

  const response = await readActivityDb({ ...filterOptions, userId });
  if (!response) return null;

  const { activity, whereQuery } = response;

  const [totalActivity] = await db
    .select({ count: count() })
    .from(ActivityTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, ActivityTable.projectId))
    .where(whereQuery);

  const totalActivityCount = totalActivity.count;

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalActivityCount;
  const clientKey = JSON.stringify({
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
export const readActivityAction = async (
  filterOptions: ReadActivityFilters,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedActivityAction(userId, filterOptions);
};
export type ReadActivityActionReturnType = UnwrapAsync<
  typeof readActivityAction
>;
