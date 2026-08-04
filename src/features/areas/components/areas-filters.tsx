"use client";

import { SearchInput } from "@/features/tasks/components/search-input";
import { useAreasParams } from "../hooks/use-areas-params";
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
import { AreasSortByOption, areasSortByOptions } from "../lib/areas-params";
import { formatAreasSortByOptions } from "../lib/formatters";
import {
  ArchiveStatusFilterOption,
  archiveStatusFilterOptions,
} from "@/lib/params";
import {
  formatArchiveStatusFilterOptions,
  formatColor,
} from "@/lib/formatters";
import {
  MultiSelect,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectTrigger,
  MultiSelectValue,
} from "@/components/ui/multi-select";
import { Color, colors } from "@/db/shared";

export const AreasFilters = () => {
  const [filters, setFilters] = useAreasParams();

  return (
    <div className="flex items-center gap-2">
      <SearchInput
        initialSearch={filters.search}
        onValueChange={(search) => setFilters({ search })}
        placeholder="Search by area name or description "
      />
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          }
        />
        <PopoverContent className="border flex flex-col gap-4" align="end">
          <div className="flex flex-col gap-2">
            <span className="text-base font-medium">Sort by</span>
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({ sortBy: value as AreasSortByOption })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by">
                  {formatAreasSortByOptions(filters.sortBy)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {areasSortByOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatAreasSortByOptions(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-medium">Archive status</span>
            <Select
              value={filters.archiveStatus}
              onValueChange={(value) =>
                setFilters({
                  archiveStatus: value as ArchiveStatusFilterOption,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by archive status">
                  {formatArchiveStatusFilterOptions(filters.archiveStatus)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {archiveStatusFilterOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatArchiveStatusFilterOptions(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-base font-medium">Colors</span>
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
        </PopoverContent>
      </Popover>
    </div>
  );
};
