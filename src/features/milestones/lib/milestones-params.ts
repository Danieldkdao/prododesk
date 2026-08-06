import { milestoneStatuses } from "@/db/shared";
import { parseAsLocalDate } from "@/features/calendar/lib/calendar-params";
import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  statuses: parseAsArrayOf(parseAsStringEnum([...milestoneStatuses]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  dueAtOnAfter: parseAsLocalDate.withOptions({ clearOnDefault: true }),
  dueAtOnBefore: parseAsLocalDate.withOptions({ clearOnDefault: true }),
};
export const loadMilestonesSearchParams = createLoader(filterSearchParams);
