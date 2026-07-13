import { taskPriorities } from "@/db/shared";
import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import {
  dayTasksSchedules,
  dayTasksSortByOptions,
  dayTasksStatuses,
} from "../lib/day-tasks-params";

export const useDayTasksParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...dayTasksSortByOptions])
        .withDefault("recently_created")
        .withOptions({ clearOnDefault: true }),
      priorities: parseAsArrayOf(parseAsStringEnum([...taskPriorities]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      status: parseAsStringEnum([...dayTasksStatuses])
        .withDefault("all")
        .withOptions({ clearOnDefault: true }),
      schedule: parseAsStringEnum([...dayTasksSchedules])
        .withDefault("any")
        .withOptions({ clearOnDefault: true }),
      timeStartRange: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
      timeEndRange: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
