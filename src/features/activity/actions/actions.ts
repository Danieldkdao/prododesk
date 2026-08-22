"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import { PAGE_SIZE } from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { cacheTag } from "next/cache";
import { ActivityFilters } from "../lib/activity-params";
import { readActivityDb } from "../server/activity";
import {
  getAreaActivityTag,
  getProjectActivityTag,
  getUserActivityTag,
} from "../server/cache/activity";
import { PaginationCursor } from "@/features/tasks/lib/types";

type ReadActivityFilters = ActivityFilters & {
  projectIds?: string[];
  areaIds?: string[];
  cursor: PaginationCursor | null;
};

const readCachedActivityAction = async (
  userId: string,
  timeZone: string,
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

  const response = await readActivityDb({
    ...filterOptions,
    userId,
    timeZone,
    limit: PAGE_SIZE + 1,
  });
  if (!response) return null;

  const { activity: a } = response;

  const hasNextPage = a.length > PAGE_SIZE;
  const activity = a.slice(0, PAGE_SIZE);
  const cursor = hasNextPage ? (activity.at(-1) ?? null) : null;
  const clientKey = JSON.stringify({
    filters: filterOptions,
    results: activity.map(({ id, createdAt }) => ({ id, createdAt })),
    hasNextPage,
  });

  return {
    activity,
    metadata: {
      hasNextPage,
      cursor,
      clientKey,
    },
  };
};
export const readActivityAction = async (
  filterOptions: ReadActivityFilters,
) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  return readCachedActivityAction(userId, user.timeZone, filterOptions);
};
export type ReadActivityActionReturnType = UnwrapAsync<
  typeof readActivityAction
>;
