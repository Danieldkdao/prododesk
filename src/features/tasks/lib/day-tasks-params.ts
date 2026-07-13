import { taskPriorities } from "@/db/shared";
import {
  createLoader,
  parseAsArrayOf,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server";

export const defaultDayTasksParamsOptions = {
  priorities: [],
  schedule: "any" as const,
  search: "",
  sortBy: "recently_created" as const,
  status: "all" as const,
  timeStartRange: null,
  timeEndRange: null,
};

export const dayTasksSortByOptions = [
  "recently_created",
  "oldest",
  "priority",
  "recently_completed",
  "name_a_z",
  "name_z_a",
] as const;
export type DayTasksSortByOption = (typeof dayTasksSortByOptions)[number];

export const dayTasksStatuses = ["all", "active", "complete"] as const;
export type DayTasksStatus = (typeof dayTasksStatuses)[number];

export const dayTasksSchedules = ["any", "scheduled", "unscheduled"] as const;
export type DayTasksSchedule = (typeof dayTasksSchedules)[number];

export const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
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
};
export const loadDayTasksSearchParams = createLoader(filterSearchParams);
