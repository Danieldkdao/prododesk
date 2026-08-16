import { db, DbTransaction } from "@/db/db";
import {
  ActivitySource,
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
import { PAGE_SIZE } from "@/lib/constants";
import { runMutationCacheInvalidation } from "@/lib/data-cache";
import { ArchiveStatusFilterOption } from "@/lib/params";
import { SQLMap } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
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
import { AreasSortByOption } from "../lib/areas-params";
import { revalidateAreaCache } from "./cache/areas";

export const confirmUserAreaOwnership = async (
  areaId: string,
  existingUserId?: string,
  tx?: DbTransaction,
) => {
  let userIdToUse: string | null | undefined = null;
  if (existingUserId) {
    userIdToUse = existingUserId;
  } else {
    const { userId } = await getCurrentUser();
    userIdToUse = userId;
  }
  if (!userIdToUse) return null;

  const [existingArea] = await (tx ?? db)
    .select()
    .from(AreaTable)
    .where(and(eq(AreaTable.id, areaId), eq(AreaTable.userId, userIdToUse)));

  return existingArea ?? null;
};

const revalidateAreaProjectsCache = async (
  userId: string,
  areaId: string,
) => {
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
    offset = (page - 1) * limit;
  }

  const normalizedSearch = search?.trim();
  const searchFilter = normalizedSearch
    ? or(
        ilike(AreaTable.name, `%${normalizedSearch}%`),
        ilike(AreaTable.description, `%${normalizedSearch}%`),
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
    ? inArray(AreaTable.id, existingAreaIds)
    : undefined;

  const whereQuery = and(
    eq(AreaTable.userId, userIdToUse),
    searchFilter,
    archivedFilter,
    colorsFilter,
    areasFilter,
  );

  let query = db
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

export const insertAreaDb = async (
  areaData: SQLMap<AreaInsertType>,
  source: ActivitySource = "user",
  tx?: DbTransaction,
) => {
  try {
    const insertArea = async (pgtx: DbTransaction) => {
      const [insertedArea] = await pgtx
        .insert(AreaTable)
        .values(areaData)
        .returning();
      if (!insertedArea) throw new Error("Failed to insert area.");

      const insertedActivity = await insertActivityDb(
        {
          source,
          action: "create",
          subject: "area",
          subjectLabel: insertedArea.name,
          subjectId: insertedArea.id,
          areaId: insertedArea.id,
          message: `Started area "${insertedArea.name}"`,
        },
        pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedArea;
    };

    const insertedArea = tx
      ? await insertArea(tx)
      : await db.transaction(insertArea);

    await runMutationCacheInvalidation(source === "ai", async () => {
      await revalidateAreaProjectsCache(insertedArea.userId, insertedArea.id);
      revalidateAreaCache(insertedArea.userId, insertedArea.id);
    });

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
  source: ActivitySource = "user",
  tx?: DbTransaction,
) => {
  const existingArea = await confirmUserAreaOwnership(areaId, undefined, tx);
  if (!existingArea) return null;

  try {
    const updateArea = async (pgtx: DbTransaction) => {
      const [updatedArea] = await pgtx
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
          source,
          action: "update",
          subject: "area",
          subjectLabel: updatedArea.name,
          subjectId: updatedArea.id,
          areaId: updatedArea.id,
          message: `Updated area "${updatedArea.name}"`,
        },
        pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedArea;
    };

    const updatedArea = tx
      ? await updateArea(tx)
      : await db.transaction(updateArea);

    await runMutationCacheInvalidation(source === "ai", async () => {
      await revalidateAreaProjectsCache(updatedArea.userId, updatedArea.id);
      revalidateAreaCache(updatedArea.userId, updatedArea.id);
    });

    return updatedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteAreaDb = async (
  areaId: string,
  source: ActivitySource = "user",
  tx?: DbTransaction,
) => {
  const existingArea = await confirmUserAreaOwnership(areaId, undefined, tx);
  if (!existingArea) return null;

  try {
    const deleteArea = async (pgtx: DbTransaction) => {
      const [deletedArea] = await pgtx
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
          source,
          action: "delete",
          subject: "area",
          subjectLabel: deletedArea.name,
          subjectId: deletedArea.id,
          message: `Deleted area "${deletedArea.name}"`,
        },
        pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedArea;
    };

    const deletedArea = tx
      ? await deleteArea(tx)
      : await db.transaction(deleteArea);

    await runMutationCacheInvalidation(source === "ai", async () => {
      await revalidateAreaProjectsCache(deletedArea.userId, deletedArea.id);
      revalidateAreaCache(deletedArea.userId, deletedArea.id);
    });

    return deletedArea;
  } catch (error) {
    console.error(error);
    return null;
  }
};
