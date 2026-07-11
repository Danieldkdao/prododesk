import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { parseAsLocalDate } from "../lib/calendar-params";

export const useCalendarParams = () => {
  return useQueryStates(
    {
      month: parseAsIsoDateTime
        .withDefault(new Date())
        .withOptions({ clearOnDefault: true }),
      day: parseAsLocalDate.withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
