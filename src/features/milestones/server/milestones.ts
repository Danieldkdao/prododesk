import { db, DbTransaction } from "@/db/db";
import {
  MilestoneInsertType,
  MilestoneSelectType,
  MilestoneTable,
} from "@/db/schema";
import { revalidateProjectCache } from "@/features/projects/server/cache/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq, SQL } from "drizzle-orm";
import { revalidateMilestoneCache } from "./cache/milestones";
import { SQLMap } from "@/lib/types";

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
  const [insertedMilestone] = await (tx ?? db)
    .insert(MilestoneTable)
    .values(milestone)
    .returning();

  revalidateMilestoneCache(
    insertedMilestone.userId,
    insertedMilestone.projectId,
  );
  revalidateProjectCache(insertedMilestone.userId, insertedMilestone.projectId);

  return insertedMilestone;
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

  const [updatedMilestone] = await (tx ?? db)
    .update(MilestoneTable)
    .set(milestone)
    .where(
      and(
        eq(MilestoneTable.id, existingMilestone.id),
        eq(MilestoneTable.userId, existingMilestone.userId),
      ),
    )
    .returning();

  revalidateMilestoneCache(updatedMilestone.userId, updatedMilestone.projectId);
  revalidateProjectCache(updatedMilestone.userId, updatedMilestone.projectId);

  return updatedMilestone;
};

export const deleteMilestoneDb = async (milestoneId: string) => {
  const existingMilestone = await confirmUserMilestoneOwnership(milestoneId);
  if (!existingMilestone) return null;

  const [deletedMilestone] = await db
    .delete(MilestoneTable)
    .where(
      and(
        eq(MilestoneTable.id, existingMilestone.id),
        eq(MilestoneTable.userId, existingMilestone.userId),
      ),
    )
    .returning();

  revalidateMilestoneCache(deletedMilestone.userId, deletedMilestone.projectId);
  revalidateProjectCache(deletedMilestone.userId, deletedMilestone.projectId);

  return deletedMilestone;
};
