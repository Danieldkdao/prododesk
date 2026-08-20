"use server";

import { ActivityMutationOptions, db, DbTransaction } from "@/db/db";
import { MilestoneStatus, MilestoneTable } from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
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
import { MilestonesFilters } from "../lib/milestones-params";
import { getProjectMilestoneTag } from "../server/cache/milestones";
import {
  confirmUserMilestoneOwnership,
  deleteMilestoneDb,
  insertMilestoneDb,
  readMilestonesDb,
  revalidateMilestoneMutationCache,
  updateMilestoneDb,
} from "../server/milestones";
import { milestoneSchema, MilestoneSchemaType } from "./schemas";

type ReadProjectMilestonesFilters = Omit<
  MilestonesFilters,
  "milestoneSearch"
> & {
  search: string;
  page: number;
};

const readCachedProjectMilestonesAction = async (
  userId: string,
  projectId: string,
  filterOptions: ReadProjectMilestonesFilters,
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
  filterOptions: ReadProjectMilestonesFilters,
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
  options?: ActivityMutationOptions,
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

  const { dueAt, position, ...rest } = data;

  try {
    const createdMilestone = await insertMilestoneDb(
      {
        ...rest,
        userId,
        position:
          position ||
          sql`(
        SELECT COALESCE(MAX(mt.position), 0)
        FROM ${MilestoneTable} mt
        WHERE mt.user_id = ${userId}
          AND mt.project_id = ${data.projectId}
      ) + 1`,
        dueAt: dueAt ? format(dueAt, "yyyy-MM-dd") : null,
      },
      options,
    );
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
  options?: ActivityMutationOptions,
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
    const updatedMilestone = await updateMilestoneDb(
      existingMilestone.id,
      {
        ...rest,
        dueAt:
          dueAt === null
            ? null
            : dueAt
              ? format(dueAt, "yyyy-MM-dd")
              : existingMilestone.dueAt,
      },
      options,
    );
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
  options?: ActivityMutationOptions,
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
    const updatedMilestone = await updateMilestoneDb(
      existingMilestone.id,
      { status: newStatus },
      options,
    );
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
  options?: ActivityMutationOptions,
) => {
  const { source = "user", tx, chatRunId } = options ?? {};
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

  const existingProject = await confirmUserProjectOwnership(projectId, userId);
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

    const moveMilestone = async (pgtx: DbTransaction) => {
      await pgtx
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

      const insertedActivity = await insertActivityDb(
        {
          source,
          subject: "milestone",
          action: "update",
          subjectId: existingMilestone.id,
          subjectLabel: existingMilestone.name,
          projectId: existingProject.id,
          message: `Moved milestone "${existingMilestone.name}" to position ${newPosition}`,
        },
        { tx: pgtx, chatRunId },
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");
    };

    if (tx) {
      await moveMilestone(tx);
    } else {
      await db.transaction(moveMilestone);
      await revalidateMilestoneMutationCache({
        source,
        userId,
        projectId: existingProject.id,
        areaId: existingProject.areaId,
      });
    }

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

export const deleteMilestoneAction = async (
  milestoneId: string,
  options?: ActivityMutationOptions,
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
    const deletedMilestone = await deleteMilestoneDb(milestoneId, options);
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
