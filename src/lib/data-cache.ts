type CacheTag =
  "tasks" | "chats" | "areas" | "projects" | "documents" | "milestones";

export const getGlobalTag = (tag: CacheTag) => {
  return `global:${tag}` as const;
};

export const getUserResourceTag = (userId: string, tag: CacheTag) => {
  return `user:${userId}:${tag}` as const;
};

export const getProjectResourceTag = (projectId: string, tag: CacheTag) => {
  return `project:${projectId}:${tag}` as const;
};

export const getIdTag = (id: string, tag: CacheTag) => {
  return `${tag}:${id}` as const;
};
