import { ActivityMutationOptions, db, DbTransaction } from "@/db/db";
import {
  MilestoneInsertType,
  MilestoneSelectType,
  MilestoneTable,
  ProjectSelectType,
} from "@/db/schema";
import { insertActivityDb } from "@/features/activity/server/activity";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { PAGE_SIZE } from "@/lib/constants";
import { runMutationCacheInvalidation } from "@/lib/data-cache";
import { SQLMap } from "@/lib/types";
import { areValidIds } from "@/lib/utils";
import { format } from "date-fns";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  max,
  or,
  SQL,
} from "drizzle-orm";
import { revalidateMilestoneCache } from "./cache/milestones";
import { MilestoneSortByOption } from "../lib/types";
import { MilestonesFilters } from "../lib/milestones-params";

export const revalidateMilestoneMutationCache = async ({
  source,
  userId,
  projectId,
  areaId,
}: {
  source: NonNullable<ActivityMutationOptions["source"]>;
  userId: string;
  projectId: string;
  areaId?: string | null;
}) => {
  await runMutationCacheInvalidation(source === "ai", () => {
    revalidateMilestoneCache(userId, projectId, areaId);
  });
};

export const confirmUserMilestoneOwnership = async (
  milestoneId: string,
  userId?: string,
  additionalFilters?: SQL<unknown>[],
  tx?: DbTransaction,
) => {
  let userIdToUse: string | null = null;
  if (userId) {
    userIdToUse = userId;
  } else {
    const { userId } = await getCurrentUser();
    if (!userId) return null;
    userIdToUse = userId;
  }
  if (!userIdToUse) return null;

  return (
    (tx ?? db).query.MilestoneTable.findFirst({
      where: and(
        eq(MilestoneTable.id, milestoneId),
        eq(MilestoneTable.userId, userIdToUse),
        ...(additionalFilters || []),
      ),
    }) ?? null
  );
};

type ReadMilestonesDbFilters = Omit<
  Partial<MilestonesFilters>,
  "milestoneSearch"
> & {
  projectIds?: string[];
  milestoneIds?: string[];
  search?: string;
  sortBy?: MilestoneSortByOption;
  userId?: string;
  limit?: number;
  page?: number;
};

export const readMilestonesDb = async (
  filterOptions: ReadMilestonesDbFilters,
) => {
  const {
    projectIds,
    milestoneIds,
    search,
    statuses,
    dueAtOnAfter,
    dueAtOnBefore,
    sortBy = "position",
    userId,
    limit = PAGE_SIZE,
    page,
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
  if (page) {
    offset = (page - 1) * limit;
  }

  const normalizedSearch = search?.trim();
  const searchFilter = normalizedSearch
    ? or(
        ilike(MilestoneTable.name, `%${normalizedSearch}%`),
        ilike(MilestoneTable.description, `%${normalizedSearch}%`),
      )
    : undefined;

  const statusesFilter = statuses?.length
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

  let existingMilestoneIds: string[] = [];
  if (milestoneIds?.length) {
    if (!areValidIds(milestoneIds)) return null;

    const existingMilestones = await Promise.all(
      milestoneIds.map((milestoneId) =>
        confirmUserMilestoneOwnership(milestoneId, userIdToUse),
      ),
    );
    existingMilestoneIds = existingMilestones
      .filter((milestone): milestone is MilestoneSelectType =>
        Boolean(milestone),
      )
      .map((milestone) => milestone.id);
    if (existingMilestoneIds.length !== milestoneIds.length) return null;
  }

  const milestonesFilter = existingMilestoneIds.length
    ? inArray(MilestoneTable.id, existingMilestoneIds)
    : undefined;

  const sortByMap: Record<
    MilestoneSortByOption,
    SQL<unknown> | SQL<unknown>[]
  > = {
    position: [asc(MilestoneTable.position), asc(MilestoneTable.id)],
    recently_created: [desc(MilestoneTable.createdAt), desc(MilestoneTable.id)],
  };

  let existingProjectIds: string[] = [];
  if (projectIds?.length) {
    if (!areValidIds(projectIds)) return null;

    const existingProjects = await Promise.all(
      projectIds.map((projectId) =>
        confirmUserProjectOwnership(projectId, userIdToUse),
      ),
    );
    existingProjectIds = existingProjects
      .filter((project): project is ProjectSelectType => Boolean(project))
      .map((project) => project.id);
    if (existingProjectIds.length !== projectIds.length) return null;
  }

  const projectsFilter = existingProjectIds.length
    ? inArray(MilestoneTable.projectId, existingProjectIds)
    : undefined;

  const whereQuery = and(
    eq(MilestoneTable.userId, userIdToUse),
    milestonesFilter,
    projectsFilter,
    searchFilter,
    statusesFilter,
    dueAtFilter,
  );

  const milestones = await db.query.MilestoneTable.findMany({
    where: whereQuery,
    orderBy: sortByMap[sortBy],
    with: {
      tasks: {
        with: {
          project: true,
        },
      },
    },
    offset: offset ?? undefined,
    limit,
  });

  return {
    milestones,
    whereQuery,
  };
};

export const insertMilestoneDb = async (
  milestone: SQLMap<MilestoneInsertType>,
  options?: ActivityMutationOptions,
) => {
  const { source = "user", tx, chatRunId } = options ?? {};
  try {
    const existingProject =
      milestone.projectId && typeof milestone.projectId === "string"
        ? await confirmUserProjectOwnership(milestone.projectId, undefined, tx)
        : null;
    if (milestone.projectId && !existingProject)
      throw new Error("No existing project found.");

    const insertMilestone = async (pgtx: DbTransaction) => {
      const [insertedMilestone] = await pgtx
        .insert(MilestoneTable)
        .values(milestone)
        .returning();
      if (!insertedMilestone) throw new Error("Failed to insert milestone.");

      const insertedActivity = await insertActivityDb(
        {
          source,
          subject: "milestone",
          action: "create",
          subjectId: insertedMilestone.id,
          subjectLabel: insertedMilestone.name,
          projectId: insertedMilestone.projectId,
          message: `Created milestone ${milestone.name}`,
        },
        { tx: pgtx, chatRunId },
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return insertedMilestone;
    };

    const insertedMilestone = tx
      ? await insertMilestone(tx)
      : await db.transaction(insertMilestone);

    if (!tx) {
      await revalidateMilestoneMutationCache({
        source,
        userId: insertedMilestone.userId,
        projectId: insertedMilestone.projectId,
        areaId: existingProject?.areaId,
      });
    }

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
  options?: ActivityMutationOptions,
) => {
  const { source = "user", tx, chatRunId } = options ?? {};
  const existingMilestone = await confirmUserMilestoneOwnership(
    milestoneId,
    undefined,
    undefined,
    tx,
  );
  if (!existingMilestone) return null;

  const existingProject = existingMilestone.projectId
    ? await confirmUserProjectOwnership(
        existingMilestone.projectId,
        undefined,
        tx,
      )
    : null;
  if (existingMilestone.projectId && !existingProject) return null;

  try {
    const updateMilestone = async (pgtx: DbTransaction) => {
      const [updatedMilestone] = await pgtx
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
          source,
          subject: "milestone",
          action: "update",
          subjectId: updatedMilestone.id,
          subjectLabel: updatedMilestone.name,
          projectId: updatedMilestone.projectId,
          message: `Updated milestone "${updatedMilestone.name}"`,
        },
        { tx: pgtx, chatRunId },
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return updatedMilestone;
    };

    const updatedMilestone = tx
      ? await updateMilestone(tx)
      : await db.transaction(updateMilestone);

    if (!tx) {
      await revalidateMilestoneMutationCache({
        source,
        userId: updatedMilestone.userId,
        projectId: updatedMilestone.projectId,
        areaId: existingProject?.areaId,
      });
    }

    return updatedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteMilestoneDb = async (
  milestoneId: string,
  options?: ActivityMutationOptions,
) => {
  const { source = "user", tx, chatRunId } = options ?? {};
  const existingMilestone = await confirmUserMilestoneOwnership(
    milestoneId,
    undefined,
    undefined,
    tx,
  );
  if (!existingMilestone) return null;

  const existingProject = existingMilestone.projectId
    ? await confirmUserProjectOwnership(
        existingMilestone.projectId,
        undefined,
        tx,
      )
    : null;
  if (existingMilestone.projectId && !existingProject) return null;

  try {
    const deleteMilestone = async (pgtx: DbTransaction) => {
      const [deletedMilestone] = await pgtx
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
          source,
          subject: "milestone",
          action: "delete",
          subjectId: deletedMilestone.id,
          subjectLabel: deletedMilestone.name,
          projectId: deletedMilestone.projectId,
          message: `Deleted milestone "${deletedMilestone.name}"`,
        },
        { tx: pgtx, chatRunId },
      );
      if (!insertedActivity) throw new Error("Failed to insert activity.");

      return deletedMilestone;
    };

    const deletedMilestone = tx
      ? await deleteMilestone(tx)
      : await db.transaction(deleteMilestone);

    if (!tx) {
      await revalidateMilestoneMutationCache({
        source,
        userId: deletedMilestone.userId,
        projectId: deletedMilestone.projectId,
        areaId: existingProject?.areaId,
      });
    }

    return deletedMilestone;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getMaxMilestonePositionDb = async (projectId: string) => {
  const { userId } = await getCurrentUser();
  if (!userId) return 0;

  const [result] = await db
    .select({
      maxPosition: max(MilestoneTable.position),
    })
    .from(MilestoneTable)
    .where(
      and(
        eq(MilestoneTable.userId, userId),
        eq(MilestoneTable.projectId, projectId),
      ),
    );

  return result?.maxPosition ?? 0;
};
