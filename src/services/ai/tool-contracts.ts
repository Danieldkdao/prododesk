export const toolNames = [
  "searchWeb",
  "scrapeWebpage",
  "readTasks",
  "createTasks",
  "updateTask",
  "updateTasksStatus",
  "updateTasksPriority",
  "assignTasksToMilestone",
  "deleteTask",
  "getCurrentTime",
  "readAreas",
  "createArea",
  "updateArea",
  "setAreaArchived",
  "deleteArea",
  "readProjects",
  "createProject",
  "updateProject",
  "setProjectArchived",
  "deleteProject",
  "readDocuments",
  "readDocument",
  "createDocument",
  "updateDocument",
  "deleteDocument",
  "readMilestones",
  "createMilestones",
  "updateMilestone",
  "updateMilestonesStatus",
  "moveMilestone",
  "deleteMilestone",
  "readActivity",
  "readUserProfile",
] as const;
export type ToolName = (typeof toolNames)[number];

export const toolContextMap: Record<
  ToolName,
  {
    requiresApproval: boolean;
  }
> = {
  searchWeb: {
    requiresApproval: false,
  },
  scrapeWebpage: {
    requiresApproval: false,
  },
  readTasks: {
    requiresApproval: false,
  },
  createTasks: {
    requiresApproval: true,
  },
  updateTask: {
    requiresApproval: true,
  },
  updateTasksStatus: {
    requiresApproval: true,
  },
  updateTasksPriority: {
    requiresApproval: true,
  },
  assignTasksToMilestone: {
    requiresApproval: true,
  },
  deleteTask: {
    requiresApproval: true,
  },
  getCurrentTime: {
    requiresApproval: false,
  },
  readAreas: {
    requiresApproval: false,
  },
  createArea: {
    requiresApproval: true,
  },
  updateArea: {
    requiresApproval: true,
  },
  setAreaArchived: {
    requiresApproval: true,
  },
  deleteArea: {
    requiresApproval: true,
  },
  readProjects: {
    requiresApproval: false,
  },
  createProject: {
    requiresApproval: true,
  },
  updateProject: {
    requiresApproval: true,
  },
  setProjectArchived: {
    requiresApproval: true,
  },
  deleteProject: {
    requiresApproval: true,
  },
  readDocuments: {
    requiresApproval: false,
  },
  readDocument: {
    requiresApproval: false,
  },
  createDocument: {
    requiresApproval: true,
  },
  updateDocument: {
    requiresApproval: true,
  },
  deleteDocument: {
    requiresApproval: true,
  },
  readMilestones: {
    requiresApproval: false,
  },
  createMilestones: {
    requiresApproval: true,
  },
  updateMilestone: {
    requiresApproval: true,
  },
  updateMilestonesStatus: {
    requiresApproval: true,
  },
  moveMilestone: {
    requiresApproval: true,
  },
  deleteMilestone: {
    requiresApproval: true,
  },
  readActivity: {
    requiresApproval: false,
  },
  readUserProfile: {
    requiresApproval: false,
  },
};
export type ToolsContext = (typeof toolContextMap)[ToolName];
