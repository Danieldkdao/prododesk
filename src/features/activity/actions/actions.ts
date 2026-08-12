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
} from "../server/cache/activity";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { ActivitySortByOption } from "../lib/activity-params";
import { PAGE_SIZE } from "@/lib/constants";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";

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

  if (filterOptions.projectIds?.length) {
    filterOptions.projectIds.forEach((projectId) => {
      cacheTag(getProjectActivityTag(projectId));
    });
  }
  if (filterOptions.areaIds?.length) {
    filterOptions.areaIds?.forEach((areaId) => {
      cacheTag(getAreaActivityTag(areaId));
    });
  }

  const {
    search,
    sortBy,
    sources,
    actions,
    subjects,
    projectIds,
    areaIds,
    page,
  } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;
  const searchFilter = or(
    ilike(ActivityTable.message, searchTerm),
    ilike(ProjectTable.name, searchTerm),
  );

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

  let existingProjectIds: string[] = [];
  if (projectIds?.length) {
    if (!areValidIds(projectIds)) return null;
    const existingProjects = await Promise.all(
      projectIds.map((projectId) =>
        confirmUserProjectOwnership(projectId, userId),
      ),
    );
    existingProjectIds = existingProjects
      .filter((project): project is ProjectSelectType => Boolean(project))
      .map((project) => project.id);
  }

  const projectsFilter = existingProjectIds.length
    ? inArray(ActivityTable.projectId, existingProjectIds)
    : undefined;

  let existingAreaIds: string[] = [];
  if (areaIds?.length) {
    if (!areValidIds(areaIds)) return null;
    const existingAreas = await Promise.all(
      areaIds.map((areaId) => confirmUserAreaOwnership(areaId, userId)),
    );
    existingAreaIds = existingAreas
      .filter((area): area is AreaSelectType => Boolean(area))
      .map((area) => area.id);
  }

  const areasFilter = existingAreaIds.length
    ? or(
        inArray(ActivityTable.areaId, existingAreaIds),
        inArray(ProjectTable.areaId, existingAreaIds),
      )
    : undefined;

  const whereQuery = and(
    eq(ActivityTable.userId, userId),
    projectsFilter,
    areasFilter,
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
