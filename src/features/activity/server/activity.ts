import { db, DbTransaction } from "@/db/db";
import {
  ActivityAction,
  ActivityInsertType,
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
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  lte,
  or,
  SQL,
} from "drizzle-orm";
import { revalidateActivityCache } from "./cache/activity";
import { ActivitySortByOption } from "../lib/activity-params";
import { PAGE_SIZE } from "@/lib/constants";
import { areValidIds } from "@/lib/utils";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";

export const readActivityDb = async (filterOptions: {
  search?: string;
  sortBy?: ActivitySortByOption;
  sources?: ActivitySource[];
  actions?: ActivityAction[];
  subjects?: ActivitySubject[];
  projectIds?: string[];
  areaIds?: string[];
  limit?: number;
  userId?: string;
  after?: Date;
  before?: Date;
  page?: number;
}) => {
  const {
    search,
    sortBy,
    sources,
    actions,
    subjects,
    projectIds,
    areaIds,
    limit = PAGE_SIZE,
    after,
    before,
    userId,
    page,
  } = filterOptions;
  let userIdToUse: string | null = null;
  if (userId) {
    userIdToUse = userId;
  } else {
    const { userId } = await getCurrentUser();
    if (!userId) return null;

    userIdToUse = userId;
  }
  if (!userIdToUse) return null;

  let offset: number | null = null;
  if (page) {
    offset = (page - 1) * limit;
  }

  const searchTerm = `%${search?.trim()}%`;
  const searchFilter = or(
    ilike(ActivityTable.message, searchTerm),
    ilike(ProjectTable.name, searchTerm),
  );

  const sortByMap: Record<ActivitySortByOption, SQL<unknown>> = {
    most_recent: desc(ActivityTable.createdAt),
    oldest: asc(ActivityTable.createdAt),
  };

  const sourcesFilter = sources?.length
    ? inArray(ActivityTable.source, sources)
    : undefined;

  const actionsFilter = actions?.length
    ? inArray(ActivityTable.action, actions)
    : undefined;

  const subjectsFilter = subjects?.length
    ? inArray(ActivityTable.subject, subjects)
    : undefined;

  const timeFilter =
    after || before
      ? and(
          after ? gte(ActivityTable.createdAt, after) : undefined,
          before ? lte(ActivityTable.createdAt, before) : undefined,
        )
      : undefined;

  let existingProjectIds: string[] = [];
  if (projectIds?.length) {
    if (!areValidIds(projectIds)) return null;
    const existingProjects = await Promise.all(
      projectIds.map((projectId) =>
        confirmUserProjectOwnership(projectId, userIdToUse),
      ),
    );
    existingProjectIds = existingProjects
      .filter((project): project is ProjectSelectType => Boolean(project))
      .map((project) => project.id);

    if (existingProjectIds.length !== projectIds.length) return null;
  }

  const projectsFilter = existingProjectIds.length
    ? inArray(ActivityTable.projectId, existingProjectIds)
    : undefined;

  let existingAreaIds: string[] = [];
  if (areaIds?.length) {
    if (!areValidIds(areaIds)) return null;
    const existingAreas = await Promise.all(
      areaIds.map((areaId) => confirmUserAreaOwnership(areaId, userIdToUse)),
    );
    existingAreaIds = existingAreas
      .filter((area): area is AreaSelectType => Boolean(area))
      .map((area) => area.id);

    if (existingAreaIds.length !== areaIds.length) return null;
  }

  const areasFilter = existingAreaIds.length
    ? or(
        inArray(ActivityTable.areaId, existingAreaIds),
        inArray(ProjectTable.areaId, existingAreaIds),
      )
    : undefined;

  const whereQuery = and(
    eq(ActivityTable.userId, userIdToUse),
    projectsFilter,
    areasFilter,
    searchFilter,
    sourcesFilter,
    actionsFilter,
    subjectsFilter,
    timeFilter,
  );

  let query = db
    .select({
      ...getTableColumns(ActivityTable),
      project: getTableColumns(ProjectTable),
    })
    .from(ActivityTable)
    .leftJoin(ProjectTable, eq(ProjectTable.id, ActivityTable.projectId))
    .where(whereQuery)
    .$dynamic();

  if (sortBy) {
    query = query.orderBy(sortByMap[sortBy]).$dynamic();
  }

  if (offset) {
    query = query.offset(offset);
  }

  const activity = await query.limit(limit);

  return {
    activity,
    whereQuery,
  };
};

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
