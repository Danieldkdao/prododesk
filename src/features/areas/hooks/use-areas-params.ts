import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { areasSortByOptions } from "../lib/areas-params";
import { archiveStatusFilterOptions } from "@/lib/params";
import { colors } from "@/db/shared";

export const useAreasParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...areasSortByOptions])
        .withDefault("recently_created")
        .withOptions({ clearOnDefault: true }),
      archiveStatus: parseAsStringEnum([...archiveStatusFilterOptions])
        .withDefault("all")
        .withOptions({ clearOnDefault: true }),
      colors: parseAsArrayOf(parseAsStringEnum([...colors]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
