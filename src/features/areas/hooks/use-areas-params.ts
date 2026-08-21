import { useQueryStates } from "nuqs";
import { areasSearchParams } from "../lib/areas-params";

export const useAreasParams = () => {
  return useQueryStates(areasSearchParams, { shallow: false });
};
