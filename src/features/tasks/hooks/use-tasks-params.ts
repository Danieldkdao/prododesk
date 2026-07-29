import { taskPriorities, taskStatuses } from "@/db/shared";
import {
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
  useQueryStates,
} from "nuqs";
import { dayTasksSortByOptions } from "../lib/tasks-params";

export const useTasksParams = () => {
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
      dateTimeStartRange: parseAsIsoDateTime.withOptions({
        clearOnDefault: true,
      }),
      dateTimeEndRange: parseAsIsoDateTime.withOptions({
        clearOnDefault: true,
      }),
    },
    { shallow: false },
  );
};
