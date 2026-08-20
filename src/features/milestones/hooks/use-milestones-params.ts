import { useQueryStates } from "nuqs";
import { milestonesSearchParams } from "../lib/milestones-params";

export const useMilestonesParams = () => {
  return useQueryStates(milestonesSearchParams, { shallow: false });
};
