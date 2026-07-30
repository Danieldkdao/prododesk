"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  taskPriorities,
  TaskPriority,
  TaskStatus,
  taskStatuses,
} from "@/db/shared";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { addDays, startOfDay, subDays } from "date-fns";
import { FilterIcon, PlusIcon } from "lucide-react";
import { useTasksParams } from "../hooks/use-tasks-params";
import {
  formatDayTasksSortByOption,
  formatTaskPriority,
  formatTaskStatus,
} from "../lib/formatters";
import {
  DayTasksSortByOption,
  dayTasksSortByOptions,
  defaultDayTasksParamsOptions,
} from "../lib/tasks-params";
import { SearchInput } from "./search-input";
import { TaskDialog } from "./task-dialog";

export const TasksFilters = ({
  defaultProject,
}: {
  defaultProject?: { id: string; name: string; icon?: string | null } | null;
}) => {
  const [calendarFilters] = useCalendarParams();
  const [filters, setFilters] = useTasksParams();

  const today = new Date();

  return (
    <div className="flex items-center gap-2 w-full">
      <SearchInput
        initialSearch={filters.search}
        onValueChange={(search) => setFilters({ search })}
        placeholder="Search tasks by name or description"
      />
      {((calendarFilters.day &&
        !(startOfDay(new Date()) > calendarFilters.day)) ||
        !calendarFilters.day) && (
        <TaskDialog
          defaultValues={{ day: calendarFilters.day, project: defaultProject }}
        >
          <Button variant="outline" size="icon">
            <PlusIcon />
          </Button>
        </TaskDialog>
      )}
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          }
        />
        <PopoverContent align="end" className="border flex flex-col gap-4 w-90">
          <div className="w-full grid grid-cols-2 gap-4">
            <div className="flex flex-col w-full gap-0.5 col-span-2">
              <Label htmlFor="day-tasks-sort-by-filter">Sort by</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  setFilters({ sortBy: value as DayTasksSortByOption })
                }
              >
                <SelectTrigger id="day-tasks-sort-by-filter" className="w-full">
                  <SelectValue placeholder="Sort by">
                    <span>{formatDayTasksSortByOption(filters.sortBy)}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-auto!">
                  {dayTasksSortByOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatDayTasksSortByOption(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col w-full gap-0.5">
              <Label htmlFor="day-tasks-status-filter">Status</Label>
              <MultiSelect
                values={filters.statuses}
                onValuesChange={(values) =>
                  setFilters({ statuses: values as TaskStatus[] })
                }
              >
                <MultiSelectTrigger
                  id="day-tasks-status-filter"
                  className="w-full"
                >
                  <MultiSelectValue placeholder="Filter by status" />
                </MultiSelectTrigger>
                <MultiSelectContent className="w-auto!">
                  {taskStatuses.map((status) => (
                    <MultiSelectItem key={status} value={status}>
                      {formatTaskStatus(status).label}
                    </MultiSelectItem>
                  ))}
                </MultiSelectContent>
              </MultiSelect>
            </div>
            <div className="flex flex-col w-full gap-0.5">
              <Label htmlFor="day-tasks-priority-filter">Priority</Label>
              <MultiSelect
                values={filters.priorities}
                onValuesChange={(values) =>
                  setFilters({ priorities: values as TaskPriority[] })
                }
              >
                <MultiSelectTrigger
                  id="day-tasks-priority-filter"
                  className="w-full"
                >
                  <MultiSelectValue placeholder="Filter by priority" />
                </MultiSelectTrigger>
                <MultiSelectContent className="w-auto!">
                  {taskPriorities.map((priority) => (
                    <MultiSelectItem key={priority} value={priority}>
                      {formatTaskPriority(priority).label}
                    </MultiSelectItem>
                  ))}
                </MultiSelectContent>
              </MultiSelect>
            </div>
            <div className="flex flex-col w-full gap-0.5">
              <Label htmlFor="day-tasks-start-range-filter">Start range</Label>
              <PopoverCalendar
                mode="single"
                value={filters.dateTimeStartRange}
                onValueChange={(date) =>
                  setFilters({ dateTimeStartRange: date })
                }
                withTime
                disabled={{
                  before: today,
                  after: filters.dateTimeEndRange
                    ? subDays(filters.dateTimeEndRange, 1)
                    : undefined,
                }}
              />
            </div>
            <div className="flex flex-col w-full gap-0.5">
              <Label htmlFor="day-tasks-end-range-filter">End range</Label>
              <PopoverCalendar
                mode="single"
                value={filters.dateTimeEndRange}
                onValueChange={(date) => setFilters({ dateTimeEndRange: date })}
                disabled={{
                  before: filters.dateTimeStartRange
                    ? addDays(filters.dateTimeStartRange, 1)
                    : today,
                }}
                withTime
              />
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => {
              setFilters(defaultDayTasksParamsOptions);
            }}
          >
            Reset filters
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};
