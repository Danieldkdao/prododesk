"use client";

import { SearchInput } from "@/features/tasks/components/search-input";
import { useActivityParams } from "../hooks/use-activity-params";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FilterIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ActivitySortByOption,
  activitySortByOptions,
} from "../lib/activity-params";
import {
  formatActivityAction,
  formatActivitySortByOption,
  formatActivitySource,
  formatActivitySubject,
} from "../lib/formatters";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import {
  ActivityAction,
  activityActions,
  ActivitySource,
  activitySources,
  ActivitySubject,
  activitySubjects,
} from "@/db/shared";
import { DEFAULT_PAGE } from "@/lib/constants";

export const ActivityFilters = () => {
  const [filters, setFilters] = useActivityParams();

  return (
    <div className="w-full flex items-center gap-2">
      <SearchInput
        initialSearch={filters.search}
        onValueChange={(search) => setFilters({ search, page: DEFAULT_PAGE })}
        placeholder="Search by activity message"
      />
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          }
        />
        <PopoverContent align="end" className="flex flex-col gap-4 border">
          <div className="flex flex-col gap-2">
            <span className="font-medium">Sort By</span>
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({
                  sortBy: value as ActivitySortByOption,
                  page: DEFAULT_PAGE,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by">
                  <span>{formatActivitySortByOption(filters.sortBy)}</span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {activitySortByOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatActivitySortByOption(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Sources</span>
            <MultiSelect
              values={filters.sources}
              onValuesChange={(values) =>
                setFilters({ sources: values as ActivitySource[] })
              }
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Filter by sources" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {activitySources.map((source) => (
                  <MultiSelectItem key={source} value={source}>
                    {formatActivitySource(source).label}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Actions</span>
            <MultiSelect
              values={filters.actions}
              onValuesChange={(values) =>
                setFilters({
                  actions: values as ActivityAction[],
                  page: DEFAULT_PAGE,
                })
              }
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Filter by actions" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {activityActions.map((action) => (
                  <MultiSelectItem key={action} value={action}>
                    {formatActivityAction(action).label}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>
          <div className="flex flex-col gap-2">
            <span className="font-medium">Subjects</span>
            <MultiSelect
              values={filters.subjects}
              onValuesChange={(values) =>
                setFilters({
                  subjects: values as ActivitySubject[],
                  page: DEFAULT_PAGE,
                })
              }
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Filter by subjects" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {activitySubjects.map((subject) => (
                  <MultiSelectItem key={subject} value={subject}>
                    {formatActivitySubject(subject).label}
                  </MultiSelectItem>
                ))}
              </MultiSelectContent>
            </MultiSelect>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
