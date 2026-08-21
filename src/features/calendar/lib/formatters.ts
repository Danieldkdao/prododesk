import { CalendarViewOption } from "./calendar-params";

export const formatCalendarViewOption = (view: CalendarViewOption) => {
  switch (view) {
    case "all":
      return "All";
    case "scheduled":
      return "Scheduled";
    case "due":
      return "Due";
    default:
      throw new Error(`Unknown calendar view option: ${view satisfies never}`);
  }
};
