import { db } from "@/db/db";
import {
  AreaInsertType,
  AreaSelectType,
  AreaTable,
  Color,
  ProjectTable,
  TaskTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { SQLMap } from "@/lib/types";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  sql,
  SQL,
} from "drizzle-orm";
import { revalidateAreaCache } from "./cache/areas";
import { AreasSortByOption } from "../lib/areas-params";
import { ArchiveStatusFilterOption } from "@/lib/params";
import { PAGE_SIZE } from "@/lib/constants";
import { PgSelect } from "drizzle-orm/pg-core";

export const confirmUserAreaOwnership = async (
  areaId: string,
  existingUserId?: string,
) => {
  let userIdToUse: string | null | undefined = null;
  if (existingUserId) {
    userIdToUse = existingUserId;
  } else {
    const { userId } = await getCurrentUser();
    userIdToUse = userId;
  }
  if (!userIdToUse) return null;

  const [existingArea] = await db
    .select()
    .from(AreaTable)
    .where(and(eq(AreaTable.id, areaId), eq(AreaTable.userId, userIdToUse)));

  return existingArea ?? null;
};

const revalidateAreaProjectsCache = async (areaId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return;

  const existingAreaProjects = await db.query.ProjectTable.findMany({
    where: and(
      eq(ProjectTable.userId, userId),
      eq(ProjectTable.areaId, areaId),
    ),
  });

  if (existingAreaProjects.length) {
    existingAreaProjects.forEach((project) => {
      revalidateProjectCache(project.userId, project.id, project.areaId);
    });
  }
};

export const readAreasDb = async (filterOptions: {
  search?: string;
  sortBy?: AreasSortByOption;
  archiveStatus?: ArchiveStatusFilterOption;
  colors?: Color[];
  page?: number;
  limit?: number;
  areaIds?: string[];
  userId?: string;
}) => {
  const {
    search,
    sortBy,
    archiveStatus,
    colors,
    page,
    userId,
    areaIds,
    limit = PAGE_SIZE,
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
  if (page !== null && page !== undefined) {
    offset = (page - 1) * PAGE_SIZE;
  }

  const searchTerm = `%${search?.trim()}%`;
  const searchFilter = search?.trim()
    ? or(
        ilike(AreaTable.name, searchTerm),
        ilike(AreaTable.description, searchTerm),
      )
    : undefined;

  const sortByMap: Record<AreasSortByOption, SQL<unknown>> = {
    recently_created: desc(AreaTable.createdAt),
    oldest: asc(AreaTable.createdAt),
    recently_updated: desc(AreaTable.updatedAt),
    position: asc(AreaTable.position),
  };

  const archiveStatusMap: Record<
    ArchiveStatusFilterOption,
    SQL<unknown> | undefined
  > = {
    all: undefined,
    active: and(eq(AreaTable.isArchived, false), isNull(AreaTable.archivedAt)),
    archived: and(
      eq(AreaTable.isArchived, true),
      isNotNull(AreaTable.archivedAt),
    ),
  };

  const colorsFilter = colors?.length
    ? inArray(AreaTable.color, colors)
    : undefined;

  const archivedFilter = archiveStatus
    ? archiveStatusMap[archiveStatus]
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
    ? inArray(AreaTable.id, existingAreaIds)
    : undefined;

  const whereQuery = and(
    eq(AreaTable.userId, userIdToUse),
    searchFilter,
    archivedFilter,
    colorsFilter,
    areasFilter,
  );

  let query: PgSelect = db
    .select({
      ...getTableColumns(AreaTable),
      activeProjectCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${ProjectTable} pt
          WHERE pt.area_id = "areas"."id"
            AND pt.is_archived = FALSE
            AND pt.status = 'active'
        )`,
      projectCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${ProjectTable} pt
          WHERE pt.area_id = "areas"."id"
        )`,
      taskCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${TaskTable} tt
          INNER JOIN ${ProjectTable} pt
            ON tt.project_id = pt.id
          WHERE pt.area_id = "areas"."id"
        )`,
      completeTaskCount: sql<number>`(
          SELECT COUNT(*)::int
          FROM ${TaskTable} tt
          INNER JOIN ${ProjectTable} pt
            ON tt.project_id = pt.id
          WHERE pt.area_id = "areas"."id"
            AND tt.status = 'completed'
        )`,
    })
    .from(AreaTable)
    .where(whereQuery)
    .$dynamic();

  if (sortBy) {
    query = query.orderBy(sortByMap[sortBy]).$dynamic();
  }
  if (offset) {
    query = query.offset(offset).$dynamic();
  }
  const areas = await query.limit(limit);

  return {
    areas,
    whereQuery,
  };
};

export const insertAreaDb = async (areaData: SQLMap<AreaInsertType>) => {
  try {
    const insertedArea = await db.transaction(async (tx) => {
      const [insertedArea] = await tx
        .insert(AreaTable)
        .values(areaData)
        .returning();
      if (!insertedArea) throw new Error("Failed to insert area.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          action: "create",
          subject: "area",
          subjectLabel: insertedArea.name,
          subjectId: insertedArea.id,
          areaId: insertedArea.id,
          message: `Started area "${insertedArea.name}"`,
        },
        tx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedArea;
    });

    await revalidateAreaProjectsCache(insertedArea.id);
    revalidateAreaCache(insertedArea.userId, insertedArea.id);

    return insertedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateAreaDb = async (
  areaId: string,
  areaData: SQLMap<
    Omit<Partial<AreaSelectType>, "id" | "createdAt" | "updatedAt" | "userId">
  >,
) => {
  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) return null;

  try {
    const updatedArea = await db.transaction(async (tx) => {
      const [updatedArea] = await tx
        .update(AreaTable)
        .set(areaData)
        .where(
          and(
            eq(AreaTable.id, existingArea.id),
            eq(AreaTable.userId, existingArea.userId),
          ),
        )
        .returning();
      if (!updatedArea) throw new Error("Failed to update area.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          action: "update",
          subject: "area",
          subjectLabel: updatedArea.name,
          subjectId: updatedArea.id,
          areaId: updatedArea.id,
          message: `Updated area "${updatedArea.name}"`,
        },
        tx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedArea;
    });

    await revalidateAreaProjectsCache(updatedArea.id);
    revalidateAreaCache(updatedArea.userId, updatedArea.id);

    return updatedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteAreaDb = async (areaId: string) => {
  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) return null;

  try {
    const deletedArea = await db.transaction(async (tx) => {
      const [deletedArea] = await tx
        .delete(AreaTable)
        .where(
          and(
            eq(AreaTable.id, existingArea.id),
            eq(AreaTable.userId, existingArea.userId),
          ),
        )
        .returning();
      if (!deletedArea) throw new Error("Failed to delete area.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          action: "delete",
          subject: "area",
          subjectLabel: deletedArea.name,
          subjectId: deletedArea.id,
          message: `Deleted area "${deletedArea.name}"`,
        },
        tx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedArea;
    });

    await revalidateAreaProjectsCache(deletedArea.id);
    revalidateAreaCache(deletedArea.userId, deletedArea.id);

    return deletedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};
