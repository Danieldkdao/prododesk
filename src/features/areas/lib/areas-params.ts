import { colors } from "@/db/shared";
import { archiveStatusFilterOptions } from "@/lib/params";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  type inferParserType,
} from "nuqs/server";

export const areasSortByOptions = [
  "recently_created",
  "oldest",
  "recently_updated",
  "position",
] as const;
export type AreasSortByOption = (typeof areasSortByOptions)[number];

export const areasSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...areasSortByOptions])
    .withDefault("recently_created")
    .withOptions({ clearOnDefault: true }),
  archiveStatus: parseAsStringEnum([...archiveStatusFilterOptions])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  colors: parseAsArrayOf(parseAsStringEnum([...colors]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
};
export type AreasFilters = inferParserType<typeof areasSearchParams>;

export const loadAreasSearchParams = createLoader(areasSearchParams);
