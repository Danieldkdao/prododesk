import { format, isValid, parse } from "date-fns";
import { createLoader, createParser, parseAsIsoDateTime } from "nuqs/server";

export const parseAsLocalDate = createParser<Date>({
  parse(queryValue) {
    const date = parse(queryValue, "yyyy-MM-dd", new Date());

    return isValid(date) ? date : null;
  },
  serialize(value) {
    return format(value, "yyyy-MM-dd");
  },
  eq(a, b) {
    return format(a, "yyyy-MM-dd") === format(b, "yyyy-MM-dd");
  },
});

const filterSearchParams = {
  month: parseAsIsoDateTime
    .withDefault(new Date())
    .withOptions({ clearOnDefault: true }),
  day: parseAsLocalDate.withOptions({ clearOnDefault: true }),
};
export const loadCalendarSearchParams = createLoader(filterSearchParams);
