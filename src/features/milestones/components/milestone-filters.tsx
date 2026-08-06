"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SearchInput } from "@/features/tasks/components/search-input";
import { FilterIcon, PlusIcon } from "lucide-react";
import { MilestoneDialog } from "./milestone-dialog";
import { TooltipWrapper } from "@/components/tooltip-wrapper";

export const MilestoneFilters = ({ projectId }: { projectId: string }) => {
  return (
    <div className="flex items-center gap-2">
      <SearchInput
        initialSearch=""
        onValueChange={() => {}}
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
        <PopoverContent className="border" align="end">
          filters go here
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
