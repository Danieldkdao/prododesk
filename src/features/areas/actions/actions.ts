"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { areaSchema, AreaSchemaType } from "./schemas";
import {
  confirmUserAreaOwnership,
  deleteAreaDb,
  insertAreaDb,
  updateAreaDb,
} from "../server/areas";
import { and, asc, count, eq, ilike, or, sql } from "drizzle-orm";
import { AreaTable } from "@/db/schema";
import { areValidIds } from "@/lib/utils";
import { cacheTag } from "next/cache";
import { getUserAreaTag } from "../server/cache/areas";
import { db } from "@/db/db";
import { UnwrapAsync } from "@/lib/types";

const readCachedUserAreas = async (
  userId: string,
  filterOptions: { search: string; page: number },
) => {
  "use cache";
  cacheTag(getUserAreaTag(userId));

  const { search, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;
  const searchQuery = search.trim()
    ? or(
        ilike(AreaTable.name, searchTerm),
        ilike(AreaTable.description, searchTerm),
      )
    : undefined;

  const whereQuery = and(eq(AreaTable.userId, userId), searchQuery);

  const areas = await db
    .select()
    .from(AreaTable)
    .where(whereQuery)
    .orderBy(asc(AreaTable.position))
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

  return {
    areas,
    metadata: {
      hasPrevPage,
      hasNextPage,
    },
  };
};
export const readUserAreasAction = async (filterOptions: {
  search: string;
  page: number;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return readCachedUserAreas(userId, filterOptions);
};
export type ReadUserAreasActionReturnType = UnwrapAsync<
  typeof readUserAreasAction
>;

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
