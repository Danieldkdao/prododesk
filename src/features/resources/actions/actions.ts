"use server";

import { readAreasDb } from "@/features/areas/server/areas";
import { readChatsDb } from "@/features/chats/server/chats";
import { readDocumentsDb } from "@/features/documents/server/documents";
import { readMilestonesDb } from "@/features/milestones/server/milestones";
import { readProjectsDb } from "@/features/projects/server/projects";
import { readTasksDb } from "@/features/tasks/server/tasks";
import { getCurrentUser } from "@/lib/auth/helpers";
import { ResourceType } from "../lib/types";

export const searchWorkspaceAction = async (filterOptions: {
  search: string;
  resources: ResourceType[];
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) return null;

  const { search, resources } = filterOptions;

  const readAreas =
    !resources.length || resources.includes("areas")
      ? readAreasDb({ userId, search, limit: 5, sortBy: "recently_created" })
      : Promise.resolve(null);
  const readProjects =
    !resources.length || resources.includes("projects")
      ? readProjectsDb({ userId, search, limit: 5, sortBy: "recently_created" })
      : Promise.resolve(null);
  const readTasks =
    !resources.length || resources.includes("tasks")
      ? readTasksDb({ userId, search, limit: 5, sortBy: "recently_created" })
      : Promise.resolve(null);
  const readMilestones =
    !resources.length || resources.includes("milestones")
      ? readMilestonesDb({
          userId,
          search,
          limit: 5,
          sortBy: "recently_created",
        })
      : Promise.resolve(null);
  const readDocuments =
    !resources.length || resources.includes("documents")
      ? readDocumentsDb({
          userId,
          search,
          limit: 5,
          sortBy: "recently_created",
        })
      : Promise.resolve(null);
  const readChats =
    !resources.length || resources.includes("chats")
      ? readChatsDb({ userId, search, limit: 5 })
      : Promise.resolve(null);

  const responses = await Promise.all([
    readAreas,
    readProjects,
    readTasks,
    readMilestones,
    readDocuments,
    readChats,
  ]);

  return {
    areas: responses[0]?.areas ?? [],
    projects: responses[1]?.projects ?? [],
    tasks: responses[2]?.tasks ?? [],
    milestones: responses[3]?.milestones ?? [],
    documents: responses[4]?.documents ?? [],
    chats: responses[5]?.chats ?? [],
  };
};
