"use server";

import { ActivityMutationOptions, db } from "@/db/db";
import {
  ActivityTable,
  AreaTable,
  DocumentTable,
  ProjectTable,
  TaskTable,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import { AreasFilters } from "../lib/areas-params";
import {
  confirmUserAreaOwnership,
  deleteAreaDb,
  insertAreaDb,
  readAreasDb,
  updateAreaDb,
} from "../server/areas";
import { getAreaIdTag, getUserAreaTag } from "../server/cache/areas";
import { areaSchema, AreaSchemaType } from "./schemas";
import {
  taskDueDateOrder,
  taskPriorityRank,
} from "@/features/tasks/lib/helpers";

type ReadAreasFilters = AreasFilters & { page: number };

const readCachedAreaAction = async (userId: string, areaId: string) => {
  "use cache";
  cacheTag(getAreaIdTag(areaId));

  const projectRank = sql`EXTRACT(EPOCH FROM ${ProjectTable.endAt})`;

  const [
    area,
    tasks,
    documents,
    activity,
    projectCounts,
    taskCounts,
    [overdueTasks],
  ] = await Promise.all([
    db.query.AreaTable.findFirst({
      where: and(eq(AreaTable.id, areaId), eq(AreaTable.userId, userId)),
      with: {
        projects: {
          where: and(
            eq(ProjectTable.userId, userId),
            eq(ProjectTable.status, "active"),
            eq(ProjectTable.isArchived, false),
          ),
          orderBy: [
            asc(projectRank),
            desc(ProjectTable.updatedAt),
            desc(ProjectTable.id),
          ],
          limit: 4,
        },
      },
    }),
    db
      .select({
        ...getTableColumns(TaskTable),
        project: getTableColumns(ProjectTable),
      })
      .from(TaskTable)
      .innerJoin(ProjectTable, eq(TaskTable.projectId, ProjectTable.id))
      .where(and(eq(TaskTable.userId, userId), eq(ProjectTable.areaId, areaId)))
      .orderBy(
        asc(taskPriorityRank(TaskTable.priority)),
        taskDueDateOrder(TaskTable.dueAt),
        desc(TaskTable.updatedAt),
        desc(TaskTable.id),
      )
      .limit(5),
    db
      .select({
        ...getTableColumns(DocumentTable),
        project: getTableColumns(ProjectTable),
      })
      .from(DocumentTable)
      .innerJoin(ProjectTable, eq(ProjectTable.id, DocumentTable.projectId))
      .where(
        and(
          eq(DocumentTable.userId, userId),
          eq(ProjectTable.id, DocumentTable.projectId),
          eq(ProjectTable.areaId, areaId),
        ),
      )
      .orderBy(desc(DocumentTable.updatedAt), desc(DocumentTable.id))
      .limit(4),
    db
      .select({
        ...getTableColumns(ActivityTable),
        project: getTableColumns(ProjectTable),
      })
      .from(ActivityTable)
      .innerJoin(ProjectTable, eq(ProjectTable.id, ActivityTable.projectId))
      .where(
        or(eq(ActivityTable.areaId, areaId), eq(ProjectTable.areaId, areaId)),
      )
      .orderBy(desc(ActivityTable.createdAt), desc(ActivityTable.id))
      .limit(5),
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
    db
      .select({
        count: count(),
      })
      .from(TaskTable)
      .innerJoin(ProjectTable, eq(ProjectTable.id, TaskTable.projectId))
      .where(
        and(
          eq(TaskTable.userId, userId),
          eq(ProjectTable.areaId, areaId),
          lte(TaskTable.dueAt, new Date()),
        ),
      ),
  ]);

  if (!area) return null;

  return {
    ...area,
    tasks,
    documents,
    activity,
    projectCounts,
    taskCounts,
    overdueTaskCount: overdueTasks.count,
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
  filterOptions: ReadAreasFilters,
) => {
  "use cache";
  cacheTag(getUserAreaTag(userId));

  const response = await readAreasDb({ ...filterOptions, userId });
  if (!response) return null;

  const page = filterOptions.page;

  const { areas, whereQuery } = response;

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
export const readAreasAction = async (filterOptions: ReadAreasFilters) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedAreasAction(userId, filterOptions);
};
export type ReadAreasActionReturnType = UnwrapAsync<typeof readAreasAction>;

export const createAreaAction = async (
  unsafeData: AreaSchemaType,
  options?: ActivityMutationOptions,
) => {
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
    const createdArea = await insertAreaDb(
      {
        ...data,
        position: sql`(
          SELECT COUNT(*)
          FROM ${AreaTable} ata
          WHERE ata.user_id = ${userId}
        ) + 1`,
        userId,
      },
      options,
    );
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
  areaData: Partial<AreaSchemaType>,
  options?: ActivityMutationOptions,
) => {
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

  const { success, data } = areaSchema.partial().safeParse(areaData);
  if (!success || Object.values(data).every((value) => value === undefined)) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const updatedArea = await updateAreaDb(existingArea.id, data, options);
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
  options?: ActivityMutationOptions,
) => {
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
    const updatedArea = await updateAreaDb(
      existingArea.id,
      {
        isArchived: newArchiveStatus,
        archivedAt: newArchiveStatus ? new Date() : null,
      },
      options,
    );
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

export const deleteAreaAction = async (
  areaId: string,
  options?: ActivityMutationOptions,
) => {
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
    const deletedArea = await deleteAreaDb(existingArea.id, options);
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
