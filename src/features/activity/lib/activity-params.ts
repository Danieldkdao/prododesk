import {
  activityActions,
  activitySources,
  activitySubjects,
} from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  type inferParserType,
} from "nuqs/server";

export const activitySortByOptions = ["most_recent", "oldest"] as const;
export type ActivitySortByOption = (typeof activitySortByOptions)[number];

export const activityGroupByOptions = [
  "all_time",
  "today",
  "yesterday",
  "this_week",
] as const;
export type ActivityGroupByOption = (typeof activityGroupByOptions)[number];

export const activitySearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
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
  groupBy: parseAsStringEnum([...activityGroupByOptions])
    .withDefault("all_time")
    .withOptions({ clearOnDefault: true }),
};
export type ActivityFilters = inferParserType<typeof activitySearchParams>;

export const loadActivitySearchParams = createLoader(activitySearchParams);
