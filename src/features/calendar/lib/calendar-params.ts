import { createLoader, parseAsIsoDate, parseAsIsoDateTime } from "nuqs/server";

const filterSearchParams = {
  month: parseAsIsoDateTime
    .withDefault(new Date())
    .withOptions({ clearOnDefault: true }),
  day: parseAsIsoDate.withOptions({ clearOnDefault: true }),
};
export const loadCalendarSearchParams = createLoader(filterSearchParams);
