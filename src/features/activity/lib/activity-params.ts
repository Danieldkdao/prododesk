import {
  activityActions,
  activitySources,
  activitySubjects,
} from "@/db/shared";
import { DEFAULT_PAGE } from "@/lib/constants";
import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const activitySortByOptions = ["most_recent", "oldest"] as const;
export type ActivitySortByOption = (typeof activitySortByOptions)[number];

const filterSearchParams = {
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
  page: parseAsInteger
    .withDefault(DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
};
export const loadActivitySearchParams = createLoader(filterSearchParams);
