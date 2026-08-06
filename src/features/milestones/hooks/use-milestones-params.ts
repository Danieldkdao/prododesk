import { milestoneStatuses } from "@/db/shared";
import { parseAsLocalDate } from "@/features/calendar/lib/calendar-params";
import {
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";

export const useMilestonesParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      statuses: parseAsArrayOf(parseAsStringEnum([...milestoneStatuses]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      dueAtOnAfter: parseAsLocalDate.withOptions({ clearOnDefault: true }),
      dueAtOnBefore: parseAsLocalDate.withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
