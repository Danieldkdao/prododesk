import { taskPriorities, taskStatuses } from "@/db/shared";
import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { dayTasksSortByOptions } from "../lib/day-tasks-params";

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
      statuses: parseAsArrayOf(parseAsStringEnum([...taskStatuses]))
        .withDefault([])
        .withOptions({ clearOnDefault: true }),
      timeStartRange: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
      timeEndRange: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
