import { useQueryStates } from "nuqs";
import { calendarSearchParams } from "../lib/calendar-params";

export const useCalendarParams = () => {
  return useQueryStates(calendarSearchParams, { shallow: false });
};
