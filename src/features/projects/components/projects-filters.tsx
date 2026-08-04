"use client";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useProjectsParams } from "../hooks/use-projects-params";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import { SearchInput } from "@/features/tasks/components/search-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ProjectsSortByOption,
  projectsSortByOptions,
} from "../lib/projects-params";
import {
  formatProjectsSortByOption,
  formatProjectStatus,
} from "../lib/formatters";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Color, colors, ProjectStatus, projectStatuses } from "@/db/shared";
import { formatColor } from "@/lib/formatters";
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import { addDays, subDays } from "date-fns";

export const ProjectsFilters = () => {
  const today = new Date();
  const [filters, setFilters] = useProjectsParams();

  return (
    <div className="w-full flex items-center gap-2">
      <SearchInput
        initialSearch={filters.search}
        onValueChange={(search) => setFilters({ search })}
        placeholder="Search by project name or outcome"
      />
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          }
        />
        <PopoverContent className="border flex flex-col gap-4 w-90" align="end">
          <div className="flex flex-col gap-2">
            <span className="font-medium">Sort By</span>
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({ sortBy: value as ProjectsSortByOption })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by">
                  {formatProjectsSortByOption(filters.sortBy)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {projectsSortByOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatProjectsSortByOption(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Statuses</span>
            <MultiSelect
              values={filters.statuses}
              onValuesChange={(values) =>
                setFilters({ statuses: values as ProjectStatus[] })
              }
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Filter by statuses" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {projectStatuses.map((status) => (
                  <MultiSelectItem key={status} value={status}>
                    {formatProjectStatus(status).text}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Colors</span>
            <MultiSelect
              values={filters.colors}
              onValuesChange={(values) =>
                setFilters({ colors: values as Color[] })
              }
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Filter by color" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {colors.map((color) => (
                  <MultiSelectItem key={color} value={color}>
                    {formatColor(color).label}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="font-medium">Start At</span>
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
            <div className="flex flex-col gap-2">
              <span className="font-medium">End At</span>
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
        </PopoverContent>
      </Popover>
    </div>
  );
};
