import { taskPriorities, taskStatuses } from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
  type inferParserType,
} from "nuqs/server";

export const defaultDayTasksParamsOptions = {
  priorities: [],
  statuses: [],
  schedule: "any" as const,
  search: "",
  sortBy: "recently_created" as const,
  status: "all" as const,
  dateTimeStartRange: null,
  dateTimeEndRange: null,
} satisfies TasksFilters & {
  schedule: "any";
  status: "all";
};

export const dayTasksSortByOptions = [
  "recently_created",
  "oldest",
  "priority",
  "name_a_z",
  "name_z_a",
] as const;
export type DayTasksSortByOption = (typeof dayTasksSortByOptions)[number];

export const tasksSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...dayTasksSortByOptions])
    .withDefault("recently_created")
    .withOptions({ clearOnDefault: true }),
  priorities: parseAsArrayOf(parseAsStringEnum([...taskPriorities]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  statuses: parseAsArrayOf(parseAsStringEnum([...taskStatuses]))
    .withDefault([])
    .withOptions({ clearOnDefault: true }),
  dateTimeStartRange: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
  dateTimeEndRange: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
};
export type TasksFilters = inferParserType<typeof tasksSearchParams>;

export const loadTasksSearchParams = createLoader(tasksSearchParams);
