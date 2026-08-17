"use server";

import { db } from "@/db/db";
import {
  ActivityAction,
  ActivitySource,
  ActivitySubject,
  ActivityTable,
  AreaSelectType,
  ProjectSelectType,
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
import {
  getAreaActivityTag,
  getProjectActivityTag,
  getUserActivityTag,
} from "../server/cache/activity";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { ActivitySortByOption } from "../lib/activity-params";
import { PAGE_SIZE } from "@/lib/constants";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";
import { readActivityDb } from "../server/activity";

const readCachedActivityAction = async (
  userId: string,
  filterOptions: {
    search: string;
    sortBy: ActivitySortByOption;
    sources: ActivitySource[];
    actions: ActivityAction[];
    subjects: ActivitySubject[];
    projectIds?: string[];
    areaIds?: string[];
    page: number;
  },
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
export const readActivityAction = async (filterOptions: {
  search: string;
  sortBy: ActivitySortByOption;
  sources: ActivitySource[];
  actions: ActivityAction[];
  subjects: ActivitySubject[];
  projectIds?: string[];
  areaIds?: string[];
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedActivityAction(userId, filterOptions);
};
export type ReadActivityActionReturnType = UnwrapAsync<
  typeof readActivityAction
>;
