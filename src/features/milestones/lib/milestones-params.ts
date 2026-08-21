import { milestoneStatuses } from "@/db/shared";
import { parseAsLocalDate } from "@/features/calendar/lib/calendar-params";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  type inferParserType,
} from "nuqs/server";

export const milestonesSearchParams = {
  milestoneSearch: parseAsString
    .withDefault("")
    .withOptions({ clearOnDefault: true }),
  statuses: parseAsArrayOf(parseAsStringEnum([...milestoneStatuses]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  dueAtOnAfter: parseAsLocalDate.withOptions({ clearOnDefault: true }),
  dueAtOnBefore: parseAsLocalDate.withOptions({ clearOnDefault: true }),
};
export type MilestonesFilters = inferParserType<
  typeof milestonesSearchParams
>;

export const loadMilestonesSearchParams = createLoader(milestonesSearchParams);
