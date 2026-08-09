import {
  parseAsInteger,
  useQueryStates,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import { activitySortByOptions } from "../lib/activity-params";
import {
  activityActions,
  activitySources,
  activitySubjects,
} from "@/db/shared";
import { DEFAULT_PAGE } from "@/lib/constants";

export const useActivityParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...activitySortByOptions])
        .withDefault("most_recent")
        .withOptions({ clearOnDefault: true }),
      sources: parseAsArrayOf(parseAsStringEnum([...activitySources]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      actions: parseAsArrayOf(parseAsStringEnum([...activityActions]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      subjects: parseAsArrayOf(parseAsStringEnum([...activitySubjects]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      page: parseAsInteger
        .withDefault(DEFAULT_PAGE)
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
