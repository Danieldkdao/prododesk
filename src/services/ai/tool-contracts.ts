export const toolNames = [
  "readTasks",
  "createTasks",
  "updateTask",
  "updateTasksStatus",
  "updateTasksPriority",
  "deleteTask",
  "getCurrentTime",
  "readAreas",
  "createArea",
  "updateArea",
  "setAreaArchived",
  "deleteArea",
] as const;
export type ToolName = (typeof toolNames)[number];
