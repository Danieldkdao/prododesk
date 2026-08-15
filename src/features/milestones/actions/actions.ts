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
import { and, between, count, eq, sql } from "drizzle-orm";
import { cacheTag } from "next/cache";
import {
  getProjectMilestoneTag,
  revalidateMilestoneCache,
} from "../server/cache/milestones";
import {
  confirmUserMilestoneOwnership,
  deleteMilestoneDb,
  insertMilestoneDb,
  readMilestonesDb,
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

  const page = filterOptions.page;

  const response = await readMilestonesDb({
    ...filterOptions,
    projectIds: [projectId],
    userId,
  });
  if (!response) return null;

  const { milestones, whereQuery } = response;

  const [totalMilestones] = await db
    .select({ count: count() })
    .from(MilestoneTable)
    .where(whereQuery);

  const hasPrevPage = page > 1;
  const hasNextPage = page * PAGE_SIZE < totalMilestones.count;
  const clientKey = JSON.stringify({
    context: {
      projectId,
    },
    filters: filterOptions,
    results: milestones.map(({ id, updatedAt }) => ({ id, updatedAt })),
    hasNextPage,
  });

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
  unsafeData: Partial<MilestoneSchemaType>,
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

  const { data, success } = milestoneSchema.partial().safeParse(unsafeData);
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

export const updateMilestoneStatusAction = async (
  milestoneId: string,
  newStatus: MilestoneStatus,
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

  try {
    const updatedMilestone = await updateMilestoneDb(existingMilestone.id, {
      status: newStatus,
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

export const moveMilestoneAction = async (
  projectId: string,
  milestoneId: string,
  newPosition: number,
) => {
  if (!areValidIds([projectId, milestoneId])) {
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

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const [totalMilestones] = await db
    .select({ count: count() })
    .from(MilestoneTable)
    .where(
      and(
        eq(MilestoneTable.userId, userId),
        eq(MilestoneTable.projectId, existingProject.id),
      ),
    );
  if (newPosition <= 0 || newPosition > totalMilestones.count) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const existingMilestone = await confirmUserMilestoneOwnership(
    milestoneId,
    userId,
    [eq(MilestoneTable.projectId, existingProject.id)],
  );
  if (!existingMilestone) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  if (newPosition === existingMilestone.position) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const oldPosition = existingMilestone.position;

  const updateSql =
    newPosition > oldPosition
      ? sql`
    CASE
      WHEN ${MilestoneTable.id} = ${existingMilestone.id}
        THEN ${newPosition}
      WHEN ${MilestoneTable.position} > ${oldPosition}
        AND ${MilestoneTable.position} <= ${newPosition}
        THEN ${MilestoneTable.position} - 1
      ELSE ${MilestoneTable.position}
    END
  `
      : sql`
    CASE
      WHEN ${MilestoneTable.id} = ${existingMilestone.id}
        THEN ${newPosition}
      WHEN ${MilestoneTable.position} < ${oldPosition}
        AND ${MilestoneTable.position} >= ${newPosition}
        THEN ${MilestoneTable.position} + 1
      ELSE ${MilestoneTable.position} + 1
    END
  `;

  try {
    const minimumPosition = Math.min(oldPosition, newPosition);
    const maximumPosition = Math.max(oldPosition, newPosition);

    await db
      .update(MilestoneTable)
      .set({
        position: updateSql,
      })
      .where(
        and(
          eq(MilestoneTable.userId, userId),
          eq(MilestoneTable.projectId, existingProject.id),
          between(MilestoneTable.position, minimumPosition, maximumPosition),
        ),
      );

    revalidateMilestoneCache(
      userId,
      existingProject.id,
      existingProject.areaId,
    );

    return {
      error: false,
      message: "Milestones reordered successfully!",
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
