"use server";

import { getCurrentUser } from "@/lib/auth/helpers";
import { milestoneSchema, MilestoneSchemaType } from "./schemas";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import {
  confirmUserMilestoneOwnership,
  deleteMilestoneDb,
  insertMilestoneDb,
  updateMilestoneDb,
} from "../server/milestones";
import { and, desc, eq, sql } from "drizzle-orm";
import { MilestoneTable } from "@/db/schema";
import { format } from "date-fns";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { UnwrapAsync } from "@/lib/types";
import { cacheTag } from "next/cache";
import { getProjectMilestoneTag } from "../server/cache/milestones";
import { db } from "@/db/db";
import { areValidIds } from "@/lib/utils";

const readCachedProjectMilestonesAction = async (
  userId: string,
  projectId: string,
) => {
  "use cache";
  cacheTag(getProjectMilestoneTag(projectId));

  const milestones = await db.query.MilestoneTable.findMany({
    where: and(
      eq(MilestoneTable.userId, userId),
      eq(MilestoneTable.projectId, projectId),
    ),
    orderBy: desc(MilestoneTable.createdAt),
  });

  return {
    milestones,
  };
};
export const readProjectMilestonesAction = async (projectId: string) => {
  if (!areValidIds(projectId)) return null;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) return null;

  return readCachedProjectMilestonesAction(userId, existingProject.id);
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
