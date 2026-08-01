type CacheTag = "tasks" | "chats" | "areas" | "projects" | "documents";

export const getGlobalTag = (tag: CacheTag) => {
  return `global:${tag}`;
};

export const getUserResourceTag = (userId: string, tag: CacheTag) => {
  return `user:${userId}:${tag}`;
};

export const getIdTag = (id: string, tag: CacheTag) => {
  return `${tag}:${id}`;
};
