"use server";

import { db } from "@/db/db";
import { ActivityTable } from "@/db/schema";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { getCurrentUser } from "@/lib/auth/helpers";
import { and, eq } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { getProjectActivityTag } from "../server/cache/activity";
import { UnwrapAsync } from "@/lib/types";
import { areValidIds } from "@/lib/utils";

const readCachedProjectActivityAction = async (
  userId: string,
  projectId: string,
) => {
  "use cache";
  cacheTag(getProjectActivityTag(projectId));

  const activity = await db
    .select()
    .from(ActivityTable)
    .where(
      and(
        eq(ActivityTable.userId, userId),
        eq(ActivityTable.projectId, projectId),
      ),
    );

  return activity;
};
export const readProjectActivityAction = async (projectId: string) => {
  if (!areValidIds(projectId)) return null;

  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject) return null;

  return readCachedProjectActivityAction(userId, existingProject.id);
};
export type ReadProjectActivityActionReturnType = UnwrapAsync<
  typeof readProjectActivityAction
>;
