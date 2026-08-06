"use client";

import { TooltipWrapper } from "@/components/tooltip-wrapper";
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
import { PopoverCalendar } from "@/components/ui/popover-calendar";
import { MilestoneStatus, milestoneStatuses } from "@/db/shared";
import { SearchInput } from "@/features/tasks/components/search-input";
import { addDays, subDays } from "date-fns";
import { FilterIcon, PlusIcon } from "lucide-react";
import { useMilestonesParams } from "../hooks/use-milestones-params";
import { formatMilestoneStatus } from "../lib/formatters";
import { MilestoneDialog } from "./milestone-dialog";

export const MilestonesFilters = ({ projectId }: { projectId: string }) => {
  const today = new Date();
  const [filters, setFilters] = useMilestonesParams();

  return (
    <div className="flex items-center gap-2">
      <SearchInput
        initialSearch={filters.search}
        onValueChange={(search) => setFilters({ search })}
        placeholder="Search by milestone name or description"
      />
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          }
        />
        <PopoverContent className="border flex flex-col gap-4 w-80" align="end">
          <div className="flex flex-col gap-2">
            <span className="font-medium text-base">Statuses</span>
            <MultiSelect
              values={filters.statuses}
              onValuesChange={(values) =>
                setFilters({ statuses: values as MilestoneStatus[] })
              }
            >
              <MultiSelectTrigger className="w-full">
                <MultiSelectValue placeholder="Filter by statuses" />
              </MultiSelectTrigger>
              <MultiSelectContent>
                {milestoneStatuses.map((status) => {
                  const { label } = formatMilestoneStatus(status);

                  return (
                    <MultiSelectItem key={status} value={status}>
                      {label}
                    </MultiSelectItem>
                  );
                })}
              </MultiSelectContent>
            </MultiSelect>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="font-medium text-base">Due On/After</span>
              <PopoverCalendar
                mode="single"
                value={filters.dueAtOnAfter}
                onValueChange={(date) =>
                  setFilters({ dueAtOnAfter: date ?? null })
                }
                disabled={{
                  before: today,
                  after: filters.dueAtOnBefore
                    ? subDays(filters.dueAtOnBefore, 1)
                    : undefined,
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="font-medium text-base">Due On/Before</span>
              <PopoverCalendar
                mode="single"
                value={filters.dueAtOnBefore}
                onValueChange={(date) =>
                  setFilters({ dueAtOnBefore: date ?? null })
                }
                disabled={{
                  before: filters.dueAtOnAfter
                    ? addDays(filters.dueAtOnAfter, 1)
                    : today,
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <MilestoneDialog projectId={projectId}>
        <TooltipWrapper content="Create new milestone">
          <Button size="icon">
            <PlusIcon />
          </Button>
        </TooltipWrapper>
      </MilestoneDialog>
    </div>
  );
};
