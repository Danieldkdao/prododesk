"use client";

import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { taskPriorities, TaskPriority } from "@/db/shared";
import { FilterIcon, PlusIcon } from "lucide-react";
import { useDayTasksParams } from "../hooks/use-day-tasks-params";
import {
  DayTasksSchedule,
  dayTasksSchedules,
  DayTasksSortByOption,
  dayTasksSortByOptions,
  DayTasksStatus,
  dayTasksStatuses,
  defaultDayTasksParamsOptions,
} from "../lib/day-tasks-params";
import {
  formatDayTasksSchedule,
  formatDayTasksSortByOption,
  formatDayTasksStatus,
  formatTaskPriority,
} from "../lib/formatters";
import { SearchInput } from "./search-input";
import { Input } from "@/components/ui/input";
import { format, startOfDay } from "date-fns";
import { Label } from "@/components/ui/label";
import { useCalendarParams } from "@/features/calendar/hooks/use-calendar-params";
import { mergeDateTime } from "@/lib/utils";
import { TaskDialog } from "./task-dialog";

export const DayTasksPanelFilters = () => {
  const [calendarFilters] = useCalendarParams();
  const [filters, setFilters] = useDayTasksParams();

  if (!calendarFilters.day) return null;

  const isPastDay = startOfDay(new Date()) > calendarFilters.day;

  return (
    <div className="flex items-center gap-2 w-full">
      <SearchInput
        initialSearch={filters.search}
        onValueChange={(search) => setFilters({ search })}
        placeholder="Search tasks by name or description"
      />
      {!isPastDay && (
        <TaskDialog defaultDay={calendarFilters.day}>
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
        <PopoverContent align="end" className="border flex flex-col gap-4">
          <div className="w-full grid grid-cols-2 gap-4">
            <div className="flex flex-col w-full gap-0.5">
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
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ status: value as DayTasksStatus })
                }
              >
                <SelectTrigger id="day-tasks-status-filter" className="w-full">
                  <SelectValue placeholder="Filter by status">
                    <span>{formatDayTasksStatus(filters.status)}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-auto!">
                  {dayTasksStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {formatDayTasksStatus(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col w-full gap-0.5">
              <Label htmlFor="day-tasks-schedule-filter">Schedule</Label>
              <Select
                value={filters.schedule}
                onValueChange={(value) =>
                  setFilters({ schedule: value as DayTasksSchedule })
                }
              >
                <SelectTrigger
                  id="day-tasks-schedule-filter"
                  className="w-full"
                >
                  <SelectValue placeholder="Filter by schedule">
                    <span>{formatDayTasksSchedule(filters.schedule)}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="w-auto!">
                  {dayTasksSchedules.map((schedule) => (
                    <SelectItem key={schedule} value={schedule}>
                      {formatDayTasksSchedule(schedule)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                      {formatTaskPriority(priority)}
                    </MultiSelectItem>
                  ))}
                </MultiSelectContent>
              </MultiSelect>
            </div>
            <div className="flex flex-col w-full gap-0.5">
              <Label htmlFor="day-tasks-start-range-filter">Start range</Label>
              <Input
                type="time"
                id="day-tasks-start-range-filter"
                placeholder="Select a start range"
                value={
                  filters.timeStartRange
                    ? format(filters.timeStartRange, "HH:mm:ss")
                    : ""
                }
                onChange={(e) => {
                  if (!calendarFilters.day) return;
                  const mergedDateTime = mergeDateTime(
                    calendarFilters.day,
                    e.target.value,
                  );
                  setFilters({ timeStartRange: mergedDateTime });
                }}
                step="1"
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
            </div>
            <div className="flex flex-col w-full gap-0.5">
              <Label htmlFor="day-tasks-end-range-filter">End range</Label>
              <Input
                type="time"
                id="day-tasks-end-range-filter"
                placeholder="Select an end range"
                value={
                  filters.timeEndRange
                    ? format(filters.timeEndRange, "HH:mm:ss")
                    : ""
                }
                onChange={(e) => {
                  if (!calendarFilters.day) return;
                  const mergedDateTime = mergeDateTime(
                    calendarFilters.day,
                    e.target.value,
                  );
                  setFilters({ timeEndRange: mergedDateTime });
                }}
                step="1"
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
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
