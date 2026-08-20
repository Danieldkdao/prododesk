import { useQueryStates } from "nuqs";
import { projectsSearchParams } from "../lib/projects-params";

export const useProjectsParams = () => {
  return useQueryStates(projectsSearchParams, { shallow: false });
};
