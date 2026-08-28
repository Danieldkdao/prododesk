import { db } from "@/db/db";
import {
  ActivityTable,
  AreaTable,
  ChatAttachmentTable,
  ChatTable,
  DocumentAssetTable,
  DocumentTable,
  MilestoneTable,
  ProjectTable,
  SettingsTable,
  TaskTable,
} from "@/db/schema";
import {
  getAreaActivityTag,
  getProjectActivityTag,
  getUserActivityTag,
} from "@/features/activity/server/cache/activity";
import {
  getAreaIdTag,
  getUserAreaTag,
} from "@/features/areas/server/cache/areas";
import {
  getChatIdTag,
  getUserChatTag,
} from "@/features/chats/server/cache/chats";
import {
  getDocumentIdTag,
  getUserDocumentTag,
} from "@/features/documents/server/cache/documents";
import {
  getProjectMilestoneTag,
  getUserMilestoneTag,
} from "@/features/milestones/server/cache/milestones";
import {
  getAreaProjectTag,
  getProjectIdTag,
  getUserProjectTag,
} from "@/features/projects/server/cache/projects";
import {
  getTaskIdTag,
  getUserTaskTag,
} from "@/features/tasks/server/cache/tasks";
import { getCurrentUser } from "@/lib/auth/helpers";
import { deleteFilesFromStorage } from "@/features/uploads/lib/delete-files";
import { eq } from "drizzle-orm";
import { revalidateTag } from "next/cache";

export const resetAccountDataDb = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  try {
    const deletedData = await db.transaction(async (tx) => {
      const attachmentKeys = (
        await tx.query.ChatAttachmentTable.findMany({
          where: eq(ChatAttachmentTable.userId, userId),
        })
      ).map((attachment) => attachment.storageKey);
      const documentAssetKeys = (
        await tx.query.DocumentAssetTable.findMany({
          where: eq(DocumentAssetTable.userId, userId),
        })
      ).map((asset) => asset.storageKey);

      const deletedChats = await tx
        .delete(ChatTable)
        .where(eq(ChatTable.userId, userId))
        .returning();

      const deletedActivity = await tx
        .delete(ActivityTable)
        .where(eq(ActivityTable.userId, userId))
        .returning();

      const deletedTasks = await tx
        .delete(TaskTable)
        .where(eq(TaskTable.userId, userId))
        .returning();

      const deletedDocuments = await tx
        .delete(DocumentTable)
        .where(eq(DocumentTable.userId, userId))
        .returning();

      const deletedMilestones = await tx
        .delete(MilestoneTable)
        .where(eq(MilestoneTable.userId, userId))
        .returning();

      const deletedProjects = await tx
        .delete(ProjectTable)
        .where(eq(ProjectTable.userId, userId))
        .returning();

      const deletedAreas = await tx
        .delete(AreaTable)
        .where(eq(AreaTable.userId, userId))
        .returning();

      const updatedSettings = await tx
        .insert(SettingsTable)
        .values({
          userId,
          description: null,
        })
        .onConflictDoUpdate({
          target: SettingsTable.userId,
          set: {
            description: null,
          },
        })
        .returning();

      return {
        deletedChats,
        deletedActivity,
        deletedTasks,
        deletedDocuments,
        deletedMilestones,
        deletedProjects,
        deletedAreas,
        updatedSettings,
        storageKeys: [...attachmentKeys, ...documentAssetKeys],
      };
    });
    if (!deletedData) throw new Error("Failed to reset account data.");

    if (deletedData.storageKeys.length > 0) {
      const deleteSuccess = await deleteFilesFromStorage(
        deletedData.storageKeys,
      );
      if (!deleteSuccess) {
        console.error(
          "Account data was reset, but storage cleanup failed for user:",
          userId,
        );
      }
    }

    const cacheTags = new Set<string>([
      getUserChatTag(userId),
      getUserActivityTag(userId),
      getUserTaskTag(userId),
      getUserDocumentTag(userId),
      getUserMilestoneTag(userId),
      getUserProjectTag(userId),
      getUserAreaTag(userId),
    ]);

    for (const chat of deletedData.deletedChats) {
      cacheTags.add(getChatIdTag(chat.id));
    }

    for (const activity of deletedData.deletedActivity) {
      if (activity.projectId) {
        cacheTags.add(getProjectActivityTag(activity.projectId));
        cacheTags.add(getProjectIdTag(activity.projectId));
      }
      if (activity.areaId) {
        cacheTags.add(getAreaActivityTag(activity.areaId));
        cacheTags.add(getAreaIdTag(activity.areaId));
      }
    }

    for (const task of deletedData.deletedTasks) {
      cacheTags.add(getTaskIdTag(task.id));
      if (task.projectId) cacheTags.add(getProjectIdTag(task.projectId));
    }

    for (const document of deletedData.deletedDocuments) {
      cacheTags.add(getDocumentIdTag(document.id));
      if (document.projectId) {
        cacheTags.add(getProjectIdTag(document.projectId));
      }
    }

    for (const milestone of deletedData.deletedMilestones) {
      cacheTags.add(getProjectMilestoneTag(milestone.projectId));
      cacheTags.add(getProjectIdTag(milestone.projectId));
    }

    for (const project of deletedData.deletedProjects) {
      cacheTags.add(getProjectIdTag(project.id));
      if (project.areaId) {
        cacheTags.add(getAreaProjectTag(project.areaId));
        cacheTags.add(getAreaIdTag(project.areaId));
      }
    }

    for (const area of deletedData.deletedAreas) {
      cacheTags.add(getAreaIdTag(area.id));
    }

    for (const tag of cacheTags) {
      revalidateTag(tag, { expire: 0 });
    }

    return deletedData;
  } catch (error) {
    console.error(error);
    return null;
  }
};
