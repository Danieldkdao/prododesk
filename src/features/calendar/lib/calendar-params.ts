import { format, isValid, parse } from "date-fns";
import {
  createLoader,
  createParser,
  parseAsStringEnum,
  type inferParserType,
} from "nuqs/server";

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

export const calendarViewOptions = ["all", "scheduled", "due"] as const;
export type CalendarViewOption = (typeof calendarViewOptions)[number];

export const calendarSearchParams = {
  month: parseAsLocalDate
    .withDefault(new Date())
    .withOptions({ clearOnDefault: true }),
  day: parseAsLocalDate.withOptions({ clearOnDefault: true }),
  view: parseAsStringEnum([...calendarViewOptions])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
};
export type CalendarFilters = inferParserType<typeof calendarSearchParams>;

export const loadCalendarSearchParams = createLoader(calendarSearchParams);
