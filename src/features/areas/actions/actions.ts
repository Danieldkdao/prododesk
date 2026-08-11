"use server";

import { db } from "@/db/db";
import { AreaTable, Color, ProjectTable, TaskTable } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { ArchiveStatusFilterOption } from "@/lib/params";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import { AreasSortByOption } from "../lib/areas-params";
import {
  confirmUserAreaOwnership,
  deleteAreaDb,
  insertAreaDb,
  updateAreaDb,
} from "../server/areas";
import { getAreaIdTag, getUserAreaTag } from "../server/cache/areas";
import { areaSchema, AreaSchemaType } from "./schemas";

export const readCachedAreaAction = async (userId: string, areaId: string) => {
  "use cache";
  cacheTag(getAreaIdTag(areaId));

  const [area, projectCounts, taskCounts] = await Promise.all([
    db.query.AreaTable.findFirst({
      where: and(eq(AreaTable.id, areaId), eq(AreaTable.userId, userId)),
      with: {
        projects: {
          // todo: add project priority ordering
          limit: 4,
        },
      },
    }),
    db
      .select({
        status: ProjectTable.status,
        count: count(),
      })
      .from(ProjectTable)
      .where(
        and(eq(ProjectTable.userId, userId), eq(ProjectTable.areaId, areaId)),
      )
      .groupBy(ProjectTable.status),
    db
      .select({
        status: TaskTable.status,
        count: count(),
      })
      .from(TaskTable)
      .innerJoin(ProjectTable, eq(ProjectTable.id, TaskTable.projectId))
      .where(and(eq(TaskTable.userId, userId), eq(ProjectTable.areaId, areaId)))
      .groupBy(TaskTable.status),
  ]);

  if (!area) return null;

  return {
    ...area,
    projectCounts,
    taskCounts,
  };
};
export const readAreaAction = async (areaId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) return null;

  return readCachedAreaAction(userId, existingArea.id);
};
export type ReadAreaActionReturnType = UnwrapAsync<typeof readAreaAction>;

const readCachedAreasAction = async (
  userId: string,
  filterOptions: {
    search: string;
    sortBy: AreasSortByOption;
    archiveStatus: ArchiveStatusFilterOption;
    colors: Color[];
    page: number;
  },
) => {
  "use cache";
  cacheTag(getUserAreaTag(userId));

  const { search, sortBy, archiveStatus, colors, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;
  const searchFilter = search.trim()
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

  const colorsFilter = colors.length
    ? inArray(AreaTable.color, colors)
    : undefined;

  const whereQuery = and(
    eq(AreaTable.userId, userId),
    searchFilter,
    archiveStatusMap[archiveStatus],
    colorsFilter,
  );

  const areas = await db
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
    .orderBy(sortByMap[sortBy])
    .offset(offset)
    .limit(PAGE_SIZE);

  const [totalAreas] = await db
    .select({
      count: count(),
    })
    .from(AreaTable)
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalAreas.count;
  const clientKey = JSON.stringify({
    filters: filterOptions,
    results: areas.map(({ id, updatedAt }) => ({ id, updatedAt })),
    hasNextPage,
  });

  return {
    areas,
    metadata: {
      hasPrevPage,
      hasNextPage,
      clientKey,
    },
  };
};
export const readAreasAction = async (filterOptions: {
  search: string;
  sortBy: AreasSortByOption;
  archiveStatus: ArchiveStatusFilterOption;
  colors: Color[];
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedAreasAction(userId, filterOptions);
};
export type ReadAreasActionReturnType = UnwrapAsync<typeof readAreasAction>;

export const createAreaAction = async (unsafeData: AreaSchemaType) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { success, data } = areaSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const createdArea = await insertAreaDb({
      ...data,
      position: sql`(
          SELECT COUNT(*)
          FROM ${AreaTable} ata
          WHERE ata.user_id = ${userId}
        ) + 1`,
      userId,
    });
    if (!createdArea) throw new Error("Failed to create area.");

    return {
      error: false,
      message: "Area created successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateAreaAction = async (
  areaId: string,
  areaData: AreaSchemaType,
) => {
  if (!areValidIds(areaId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { success, data } = areaSchema.safeParse(areaData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedArea = await updateAreaDb(existingArea.id, data);
    if (!updatedArea) throw new Error("Failed to update area.");

    return {
      error: false,
      message: "Area updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const toggleAreaArchiveStatusAction = async (
  areaId: string,
  newArchiveStatus: boolean,
) => {
  if (!areValidIds(areaId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const updatedArea = await updateAreaDb(existingArea.id, {
      isArchived: newArchiveStatus,
      archivedAt: new Date(),
    });
    if (!updatedArea) throw new Error("Failed to update area archive status.");

    return {
      error: false,
      message: newArchiveStatus
        ? "Area archived successfully!"
        : "Area restored successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteAreaAction = async (areaId: string) => {
  if (!areValidIds(areaId)) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedArea = await deleteAreaDb(existingArea.id);
    if (!deletedArea) throw new Error("Failed to delete area.");

    return {
      error: false,
      message: "Area deleted successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
