import { taskPriorities, taskStatuses } from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
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
};

export const dayTasksSortByOptions = [
  "recently_created",
  "oldest",
  "priority",
  "name_a_z",
  "name_z_a",
] as const;
export type DayTasksSortByOption = (typeof dayTasksSortByOptions)[number];

export const filterSearchParams = {
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
export const loadTasksSearchParams = createLoader(filterSearchParams);
