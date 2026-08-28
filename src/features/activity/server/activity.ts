import { ActivityMutationOptions, db } from "@/db/db";
import {
  ActivityInsertType,
  ActivitySelectType,
  ActivityTable,
  AreaSelectType,
  ArtifactTable,
  ProjectSelectType,
  ProjectTable,
} from "@/db/schema";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";
import { findChatRunDb } from "@/features/chats/server/chat-runs";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { PaginationCursor } from "@/features/tasks/lib/types";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PAGE_SIZE } from "@/lib/constants";
import { runMutationCacheInvalidation } from "@/lib/data-cache";
import { getLocalDayBounds, getLocalWeekBounds } from "@/lib/utils";
import { tz } from "@date-fns/tz";
import { subDays } from "date-fns";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  lte,
  or,
  SQL,
} from "drizzle-orm";
import { TZDate } from "react-day-picker";
import {
  ActivityFilters,
  ActivityGroupByOption,
  ActivitySortByOption,
} from "../lib/activity-params";
import { revalidateActivityCache } from "./cache/activity";

type ReadActivityDbFilters = Partial<ActivityFilters> & {
  projectIds?: string[];
  areaIds?: string[];
  limit?: number;
  userId?: string;
  timeZone?: string;
  after?: Date;
  before?: Date;
  cursor?: PaginationCursor | null;
};

export const readActivityDb = async (filterOptions: ReadActivityDbFilters) => {
  const {
    search,
    sortBy = "most_recent",
    sources,
    actions,
    subjects,
    groupBy,
    projectIds,
    areaIds,
    limit = PAGE_SIZE,
    after,
    before,
    userId,
    timeZone,
    cursor,
  } = filterOptions;
  const userIdToUse = userId ?? (await getCurrentUser()).userId;
  const timeZoneToUse = timeZone ?? (await getCurrentUser()).user?.timeZone;
  if (!userIdToUse || !timeZoneToUse) return null;

  const normalizedSearch = search?.trim();
  const searchFilter = normalizedSearch
    ? or(
        ilike(ActivityTable.message, `%${normalizedSearch}%`),
        ilike(ProjectTable.name, `%${normalizedSearch}%`),
      )
    : undefined;

  const sortByMap: Record<ActivitySortByOption, SQL<unknown>[]> = {
    most_recent: [desc(ActivityTable.createdAt), desc(ActivityTable.id)],
    oldest: [asc(ActivityTable.createdAt), asc(ActivityTable.id)],
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

  const today = TZDate.tz(timeZoneToUse);
  const yesterday = subDays(TZDate.tz(timeZoneToUse), 1, {
    in: tz(timeZoneToUse),
  });

  const { startUtc: todayStartUtc, endUtc: todayEndUtc } = getLocalDayBounds(
    today,
    timeZoneToUse,
  );
  const { startUtc: yesterdayStartUtc, endUtc: yesterdayEndUtc } =
    getLocalDayBounds(yesterday, timeZoneToUse);
  const { startUtc: weekStartUtc, endUtc: weekEndUtc } = getLocalWeekBounds(
    today,
    timeZoneToUse,
  );

  const groupByMap: Record<ActivityGroupByOption, SQL<unknown> | undefined> = {
    all_time: undefined,
    today: and(
      gte(ActivityTable.createdAt, todayStartUtc),
      lte(ActivityTable.createdAt, todayEndUtc),
    ),
    yesterday: and(
      gte(ActivityTable.createdAt, yesterdayStartUtc),
      lte(ActivityTable.createdAt, yesterdayEndUtc),
    ),
    this_week: and(
      gte(ActivityTable.createdAt, weekStartUtc),
      lte(ActivityTable.createdAt, weekEndUtc),
    ),
  };
  const groupByFilter = groupBy ? groupByMap[groupBy] : undefined;

  const timeFilter =
    after || before
      ? and(
          after ? gte(ActivityTable.createdAt, after) : undefined,
          before ? lte(ActivityTable.createdAt, before) : undefined,
        )
      : undefined;

  let existingProjectIds: string[] = [];
  if (projectIds?.length) {
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

  const compare = sortBy === "oldest" ? gt : lt;

  let cursorFilter: SQL<unknown> | undefined = undefined;
  if (cursor) {
    cursorFilter = or(
      and(
        eq(ActivityTable.createdAt, cursor.createdAt),
        compare(ActivityTable.id, cursor.id),
      ),
      compare(ActivityTable.createdAt, cursor.createdAt),
    );
  }

  const whereQuery = and(
    eq(ActivityTable.userId, userIdToUse),
    projectsFilter,
    areasFilter,
    searchFilter,
    sourcesFilter,
    actionsFilter,
    subjectsFilter,
    groupByFilter,
    timeFilter,
    cursorFilter,
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
    query = query.orderBy(...sortByMap[sortBy]).$dynamic();
  }

  const activity = await query.limit(limit);

  return {
    activity,
    whereQuery,
  };
};

export const insertActivityDb = async (
  data: Omit<ActivityInsertType, "userId">,
  options?: Pick<ActivityMutationOptions, "tx" | "chatRunId">,
) => {
  const { tx, chatRunId } = options ?? {};
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingProject = data.projectId
    ? await confirmUserProjectOwnership(data.projectId, userId, tx)
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
    orderBy: [desc(ActivityTable.createdAt), desc(ActivityTable.id)],
  });

  let activityToReturn: ActivitySelectType | null = null;

  if (lastActivity) {
    activityToReturn = lastActivity;
  } else {
    const [insertedActivity] = await (tx ?? db)
      .insert(ActivityTable)
      .values({ ...data, userId })
      .returning();
    if (!insertedActivity) return null;

    await runMutationCacheInvalidation(data.source === "ai", () => {
      revalidateActivityCache(
        insertedActivity.userId,
        insertedActivity.projectId,
        existingProject?.areaId ?? insertedActivity.areaId,
      );
    });

    activityToReturn = insertedActivity;
  }

  if (chatRunId && activityToReturn?.subjectId) {
    const existingChatRun = await findChatRunDb({ id: chatRunId }, tx);
    if (!existingChatRun) return activityToReturn;

    await (tx ?? db)
      .insert(ArtifactTable)
      .values({
        chatRunId: existingChatRun.id,
        activityId: activityToReturn.id,
        subject: activityToReturn.subject,
        subjectId: activityToReturn.subjectId,
      })
      .onConflictDoUpdate({
        target: [
          ArtifactTable.chatRunId,
          ArtifactTable.subject,
          ArtifactTable.subjectId,
        ],
        set: {
          activityId: activityToReturn.id,
        },
      });
  }

  return activityToReturn;
};
