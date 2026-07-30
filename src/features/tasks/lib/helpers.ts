import { TaskStatus, taskStatuses } from "@/db/shared";

export const isTaskStatus = (
  uncheckedStatus: unknown,
): uncheckedStatus is TaskStatus => {
  if (!uncheckedStatus || typeof uncheckedStatus !== "string") return false;

  return taskStatuses.includes(uncheckedStatus as TaskStatus);
};
