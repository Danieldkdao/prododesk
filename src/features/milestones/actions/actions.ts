"use server";

import { db } from "@/db/db";
import { MilestoneStatus, MilestoneTable } from "@/db/schema";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  PAGE_SIZE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { format } from "date-fns";
import {
  and,
  asc,
  count,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getProjectMilestoneTag } from "../server/cache/milestones";
import {
  confirmUserMilestoneOwnership,
  deleteMilestoneDb,
  insertMilestoneDb,
  updateMilestoneDb,
} from "../server/milestones";
import { milestoneSchema, MilestoneSchemaType } from "./schemas";

const readCachedProjectMilestonesAction = async (
  userId: string,
  projectId: string,
  filterOptions: {
    search: string;
    statuses: MilestoneStatus[];
    dueAtOnAfter: Date | null;
    dueAtOnBefore: Date | null;
    page: number;
  },
) => {
  "use cache";
  cacheTag(getProjectMilestoneTag(projectId));

  const { search, statuses, dueAtOnAfter, dueAtOnBefore, page } = filterOptions;

  const offset = (page - 1) * PAGE_SIZE;

  const searchTerm = `%${search.trim()}%`;
  const searchFilter = search.trim()
    ? or(
        ilike(MilestoneTable.name, searchTerm),
        ilike(MilestoneTable.description, searchTerm),
      )
    : undefined;

  const statusesFilter = statuses.length
    ? inArray(MilestoneTable.status, statuses)
    : undefined;

  const dueAtFilter = and(
    dueAtOnAfter
      ? gte(MilestoneTable.dueAt, format(dueAtOnAfter, "yyyy-MM-dd"))
      : undefined,
    dueAtOnBefore
      ? lte(MilestoneTable.dueAt, format(dueAtOnBefore, "yyyy-MM-dd"))
      : undefined,
  );

  const whereQuery = and(
    eq(MilestoneTable.userId, userId),
    eq(MilestoneTable.projectId, projectId),
    searchFilter,
    statusesFilter,
    dueAtFilter,
  );

  const milestones = await db.query.MilestoneTable.findMany({
    where: whereQuery,
    orderBy: asc(MilestoneTable.position),
    with: {
      tasks: true,
    },
    offset,
    limit: PAGE_SIZE,
  });

  const [totalMilestones] = await db
    .select({ count: count() })
    .from(MilestoneTable)
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalMilestones.count;
  const clientKey = `${JSON.stringify(milestones)}${hasNextPage ? "has next page" : "no next page"}`;

  return {
    milestones,
    metadata: {
      hasPrevPage,
      hasNextPage,
      clientKey,
    },
  };
};
export const readProjectMilestonesAction = async (
  projectId: string,
  filterOptions: {
    search: string;
    statuses: MilestoneStatus[];
    dueAtOnAfter: Date | null;
    dueAtOnBefore: Date | null;
    page: number;
  },
) => {
  if (!areValidIds(projectId)) return null;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) return null;

  return readCachedProjectMilestonesAction(
    userId,
    existingProject.id,
    filterOptions,
  );
};
export type ReadProjectMilestonesActionType = UnwrapAsync<
  typeof readProjectMilestonesAction
>;

export const createMilestoneAction = async (
  unsafeData: MilestoneSchemaType,
) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { success, data } = milestoneSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { dueAt, ...rest } = data;

  try {
    const createdMilestone = await insertMilestoneDb({
      ...rest,
      userId,
      position: sql`(
        SELECT COUNT(*)
        FROM ${MilestoneTable} mt
        WHERE mt.user_id = ${userId}
          AND mt.project_id = ${data.projectId}
      ) + 1`,
      dueAt: dueAt ? format(dueAt, "yyyy-MM-dd") : null,
    });
    if (!createdMilestone) throw new Error("Failed to create milestone.");

    return {
      error: false,
      message: "Milestone added successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const updateMilestoneAction = async (
  milestoneId: string,
  unsafeData: MilestoneSchemaType,
) => {
  if (!areValidIds(milestoneId)) {
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

  const existingMilestone = await confirmUserMilestoneOwnership(milestoneId);
  if (!existingMilestone) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { data, success } = milestoneSchema.safeParse(unsafeData);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { dueAt, ...rest } = data;

  try {
    const updatedMilestone = await updateMilestoneDb(existingMilestone.id, {
      ...rest,
      dueAt: dueAt ? format(dueAt, "yyyy-MM-dd") : null,
    });
    if (!updatedMilestone) throw new Error("Failed to update milestone.");

    return {
      error: false,
      message: "Milestone updated successfully!",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};

export const deleteMilestoneAction = async (milestoneId: string) => {
  if (!areValidIds(milestoneId)) {
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

  const existingMilestone = await confirmUserMilestoneOwnership(milestoneId);
  if (!existingMilestone) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  try {
    const deletedMilestone = await deleteMilestoneDb(milestoneId);
    if (!deletedMilestone) throw new Error("Failed to delete milestone.");

    return {
      error: false,
      message: "Milestone deleted successfully.",
    };
  } catch (error) {
    console.error(error);
    return {
      error: true,
      message: GENERAL_ERROR_MESSAGE,
    };
  }
};
