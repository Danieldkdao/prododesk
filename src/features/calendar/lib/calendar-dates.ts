import { TZDate, tz } from "@date-fns/tz";
import { endOfDay, format, isValid, parse, startOfDay } from "date-fns";

export const calendarDateKey = (date: Date | string) =>
  typeof date === "string" ? date : format(date, "yyyy-MM-dd");

export const calendarDateInTimeZone = (date: Date | string, timeZone: string) => {
  const key = calendarDateKey(date);
  const localDate = parse(key, "yyyy-MM-dd", TZDate.tz(timeZone), {
    in: tz(timeZone),
  });
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(key) ||
    !isValid(localDate) ||
    format(localDate, "yyyy-MM-dd") !== key
  ) {
    throw new Error("Invalid calendar date.");
  }
  return localDate;
};

export const calendarDayBounds = (date: Date | string, timeZone: string) => {
  const localDate = calendarDateInTimeZone(date, timeZone);
  return {
    startUtc: startOfDay(localDate, { in: tz(timeZone) }),
    endUtc: endOfDay(localDate, { in: tz(timeZone) }),
  };
};
