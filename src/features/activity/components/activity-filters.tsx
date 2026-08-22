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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ActivityAction,
  activityActions,
  ActivitySource,
  activitySources,
  ActivitySubject,
  activitySubjects,
} from "@/db/shared";
import { SearchInput } from "@/features/tasks/components/search-input";
import { FilterIcon } from "lucide-react";
import { useActivityParams } from "../hooks/use-activity-params";
import {
  ActivityGroupByOption,
  activityGroupByOptions,
  ActivitySortByOption,
  activitySortByOptions,
  activityViewOptions,
} from "../lib/activity-params";
import {
  formatActivityAction,
  formatActivityGroupByOption,
  formatActivitySortByOption,
  formatActivitySource,
  formatActivitySubject,
  formatActivityViewOption,
} from "../lib/formatters";

export const ActivityFilters = () => {
  const [filters, setFilters] = useActivityParams();

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2">
      <div className="w-full flex items-center gap-2 md:flex-1">
        <SearchInput
          initialSearch={filters.search}
          onValueChange={(search) => setFilters({ search })}
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
              <span className="font-medium">Group By</span>
              <Select
                value={filters.groupBy}
                onValueChange={(value) =>
                  setFilters({ groupBy: value as ActivityGroupByOption })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Group by">
                    <span>{formatActivityGroupByOption(filters.groupBy)}</span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {activityGroupByOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {formatActivityGroupByOption(option)}
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
      <Tabs
        value={filters.view}
        onValueChange={(value) => setFilters({ view: value })}
      >
        <TabsList>
          {activityViewOptions.map((option) => (
            <TabsTrigger key={option} value={option}>
              {formatActivityViewOption(option)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};
