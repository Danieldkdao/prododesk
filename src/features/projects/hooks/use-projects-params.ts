import { colors, projectStatuses } from "@/db/shared";
import { parseAsLocalDate } from "@/features/calendar/lib/calendar-params";
import { archiveStatusFilterOptions } from "@/lib/params";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { projectsSortByOptions } from "../lib/projects-params";

export const useProjectsParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...projectsSortByOptions])
        .withDefault("recently_created")
        .withOptions({ clearOnDefault: true }),
      colors: parseAsArrayOf(parseAsStringEnum([...colors]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      statuses: parseAsArrayOf(parseAsStringEnum([...projectStatuses]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      archiveStatus: parseAsStringEnum([...archiveStatusFilterOptions])
        .withDefault("all")
        .withOptions({ clearOnDefault: true }),
      dateTimeStartRange: parseAsLocalDate.withOptions({
        clearOnDefault: true,
      }),
      dateTimeEndRange: parseAsLocalDate.withOptions({
        clearOnDefault: true,
      }),
    },
    { shallow: false },
  );
};
