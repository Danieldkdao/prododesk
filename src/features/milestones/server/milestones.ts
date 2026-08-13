import { db, DbTransaction } from "@/db/db";
import {
  MilestoneInsertType,
  MilestoneSelectType,
  MilestoneTable,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { SQLMap } from "@/lib/types";
import { and, eq, SQL } from "drizzle-orm";
import { revalidateMilestoneCache } from "./cache/milestones";

export const confirmUserMilestoneOwnership = async (
  milestoneId: string,
  additionalFilters?: SQL<unknown>[],
) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  return (
    db.query.MilestoneTable.findFirst({
      where: and(
        eq(MilestoneTable.id, milestoneId),
        eq(MilestoneTable.userId, userId),
        ...(additionalFilters || []),
      ),
    }) ?? null
  );
};

export const insertMilestoneDb = async (
  milestone: SQLMap<MilestoneInsertType>,
  tx?: DbTransaction,
) => {
  try {
    const existingProject =
      milestone.projectId && typeof milestone.projectId === "string"
        ? await confirmUserProjectOwnership(milestone.projectId)
        : null;
    if (milestone.projectId && !existingProject)
      throw new Error("No existing project found.");

    const insertedMilestone = await db.transaction(async (pgtx) => {
      const [insertedMilestone] = await (tx ?? pgtx)
        .insert(MilestoneTable)
        .values(milestone)
        .returning();
      if (!insertedMilestone) throw new Error("Failed to insert milestone.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "milestone",
          action: "create",
          subjectId: insertedMilestone.id,
          subjectLabel: insertedMilestone.name,
          projectId: insertedMilestone.projectId,
          message: `Created milestone ${milestone.name}`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedMilestone;
    });

    revalidateMilestoneCache(
      insertedMilestone.userId,
      insertedMilestone.projectId,
      existingProject?.areaId,
    );

    return insertedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateMilestoneDb = async (
  milestoneId: string,
  milestone: Omit<
    Partial<MilestoneSelectType>,
    "id" | "userId" | "projectId" | "createdAt" | "updatedAt"
  >,
  tx?: DbTransaction,
) => {
  const existingMilestone = await confirmUserMilestoneOwnership(milestoneId);
  if (!existingMilestone) return null;

  const existingProject = existingMilestone.projectId
    ? await confirmUserProjectOwnership(existingMilestone.projectId)
    : null;
  if (existingMilestone.projectId && !existingProject) return null;

  try {
    const updatedMilestone = await db.transaction(async (pgtx) => {
      const [updatedMilestone] = await (tx ?? pgtx)
        .update(MilestoneTable)
        .set(milestone)
        .where(
          and(
            eq(MilestoneTable.id, existingMilestone.id),
            eq(MilestoneTable.userId, existingMilestone.userId),
          ),
        )
        .returning();
      if (!updatedMilestone) throw new Error("Failed to update milestone.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "milestone",
          action: "update",
          subjectId: updatedMilestone.id,
          subjectLabel: updatedMilestone.name,
          projectId: updatedMilestone.projectId,
          message: `Updated milestone "${updatedMilestone.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedMilestone;
    });

    revalidateMilestoneCache(
      updatedMilestone.userId,
      updatedMilestone.projectId,
      existingProject?.areaId,
    );

    return updatedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteMilestoneDb = async (
  milestoneId: string,
  tx?: DbTransaction,
) => {
  const existingMilestone = await confirmUserMilestoneOwnership(milestoneId);
  if (!existingMilestone) return null;

  const existingProject = existingMilestone.projectId
    ? await confirmUserProjectOwnership(existingMilestone.projectId)
    : null;
  if (existingMilestone.projectId && !existingProject) return null;

  try {
    const deletedMilestone = await db.transaction(async (pgtx) => {
      const [deletedMilestone] = await (tx ?? pgtx)
        .delete(MilestoneTable)
        .where(
          and(
            eq(MilestoneTable.id, existingMilestone.id),
            eq(MilestoneTable.userId, existingMilestone.userId),
          ),
        )
        .returning();
      if (!deletedMilestone) throw new Error("Failed to delete milestone.");

      const insertedActivity = await insertActivityDb(
        {
          source: "user",
          subject: "milestone",
          action: "delete",
          subjectId: deletedMilestone.id,
          subjectLabel: deletedMilestone.name,
          projectId: deletedMilestone.projectId,
          message: `Deleted milestone "${deletedMilestone.name}"`,
        },
        tx ?? pgtx,
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedMilestone;
    });

    revalidateMilestoneCache(
      deletedMilestone.userId,
      deletedMilestone.projectId,
      existingProject?.areaId,
    );

    return deletedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};
