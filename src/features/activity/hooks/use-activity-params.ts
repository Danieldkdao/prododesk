import { useQueryStates } from "nuqs";
import { activitySearchParams } from "../lib/activity-params";

export const useActivityParams = () => {
  return useQueryStates(activitySearchParams, { shallow: false });
};
