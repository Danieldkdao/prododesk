import { useQueryStates } from "nuqs";
import { tasksSearchParams } from "../lib/tasks-params";

export const useTasksParams = () => {
  return useQueryStates(tasksSearchParams, { shallow: false });
};
