import { colors, projectStatuses } from "@/db/shared";
import { parseAsLocalDate } from "@/features/calendar/lib/calendar-params";
import { archiveStatusFilterOptions } from "@/lib/params";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  type inferParserType,
} from "nuqs/server";

export const projectsSortByOptions = [
  "recently_created",
  "oldest",
  "recently_updated",
] as const;
export type ProjectsSortByOption = (typeof projectsSortByOptions)[number];

export const projectsSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
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
  dateTimeStartRange: parseAsLocalDate.withOptions({ clearOnDefault: true }),
  dateTimeEndRange: parseAsLocalDate.withOptions({ clearOnDefault: true }),
};
export type ProjectsFilters = inferParserType<typeof projectsSearchParams>;

export const loadProjectsSearchParams = createLoader(projectsSearchParams);
