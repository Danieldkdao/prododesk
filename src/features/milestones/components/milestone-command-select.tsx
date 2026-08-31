"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { MilestoneSelectType, MilestoneStatus } from "@/db/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { ChevronDownIcon } from "lucide-react";
import { useCallback, useState, useTransition } from "react";
import { readProjectMilestonesAction } from "../actions/actions";
import { formatMilestoneStatus } from "../lib/formatters";

export const MilestoneCommandSelect = ({
  id,
  fieldError,
  initialValue,
  value,
  onValueChange,
  projectId,
  triggerClassName,
}: {
  id?: string;
  fieldError?: boolean;
  initialValue?: { name: string; status: MilestoneStatus } | null | undefined;
  value?: string | null | undefined;
  onValueChange: (value: unknown) => void;
  projectId?: string | null;
  triggerClassName?: string;
}) => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isSearchPending, startSearchTransition] = useTransition();

  const fetchMilestones = useCallback(
    (nextPage: number) => {
      if (!projectId) return Promise.resolve(null);
      return readProjectMilestonesAction(projectId, {
        search,
        statuses: [],
        dueAtOnAfter: null,
        dueAtOnBefore: null,
        page: nextPage,
      });
    },
    [search, projectId],
  );

  const {
    items: milestones,
    setItems: setMilestones,
    setPage,
    setHasNextPage,
    isPending: isInfinitePending,
    setContainerEl,
    setSentinelEl,
  } = useInfiniteScroll<MilestoneSelectType, "milestones">(
    [],
    true,
    fetchMilestones,
    {
      additionalScrollDeps: [commandOpen, search, projectId],
      defaultPage: DEFAULT_PAGE - 1,
    },
  );

  const handleSearch = () => {
    startSearchTransition(async () => {
      if (!projectId) return;
      const response = await readProjectMilestonesAction(projectId, {
        search,
        statuses: [],
        dueAtOnAfter: null,
        dueAtOnBefore: null,
        page: DEFAULT_PAGE,
      });

      if (!response) return;

      const { milestones, metadata } = response;

      setMilestones(milestones);
      setPage(DEFAULT_PAGE);
      setHasNextPage(metadata.hasNextPage);
    });
  };
  const handleDebouncedSearch = useDebouncedCallback(handleSearch, {
    wait: 250,
  });

  const selectedMilestone = milestones.find(
    (milestone) => milestone.id === value,
  );

  return (
    <Popover open={commandOpen} onOpenChange={setCommandOpen}>
      <PopoverTrigger
        id={id}
        aria-invalid={!!fieldError}
        disabled={!projectId}
        className={cn(
          "border-b cursor-pointer h-11 flex items-center gap-2 w-full min-w-0",
          triggerClassName,
        )}
      >
        <div className="min-w-0 w-full flex items-center gap-2">
          {selectedMilestone ? (
            (() => {
              const { icon: Icon } = formatMilestoneStatus(
                selectedMilestone.status,
              );
              return (
                <>
                  <Icon className="size-4" />
                  <span className="min-w-0 truncate">
                    {selectedMilestone.name}
                  </span>
                </>
              );
            })()
          ) : initialValue && value ? (
            (() => {
              const { icon: Icon } = formatMilestoneStatus(initialValue.status);
              return (
                <>
                  <Icon className="size-4" />
                  <span className="min-w-0 truncate">{initialValue.name}</span>
                </>
              );
            })()
          ) : (
            <span className="text-muted-foreground">No milestone selected</span>
          )}
        </div>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-60 w-(--anchor-width) min-w-80 p-0 border"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              handleDebouncedSearch();
            }}
            placeholder="Search for milestones by name or description..."
          />

          <CommandList ref={setContainerEl}>
            <CommandEmpty>No milestones found.</CommandEmpty>
            <CommandGroup>
              {isSearchPending
                ? Array.from({ length: 4 }).map((_, index) => (
                    <MilestoneCommandItemSkeleton key={index} />
                  ))
                : milestones.map((milestone) => {
                    const isSelected = milestone.id === selectedMilestone?.id;
                    const { icon: Icon, textColor } = formatMilestoneStatus(
                      milestone.status,
                    );

                    return (
                      <CommandItem
                        key={milestone.id}
                        value={milestone.id}
                        className={cn(
                          "min-w-0",
                          isSelected &&
                            "bg-primary/15 hover:bg-primary/10 data-selected:bg-primary/10",
                        )}
                        onSelect={() => {
                          onValueChange(isSelected ? null : milestone.id);
                          setCommandOpen(false);
                          setSearch("");
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon className={cn("size-8 shrink-0", textColor)} />
                          <div className="flex flex-1 w-full min-w-0 flex-col gap-px">
                            <span className="truncate text-base font-medium">
                              {milestone.name}
                            </span>
                            <span
                              className={cn(
                                "truncate text-xs text-muted-foreground",
                                !milestone.description && "italic",
                              )}
                            >
                              {milestone.description ||
                                "No description provided."}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
              {isInfinitePending &&
                Array.from({ length: 4 }).map((_, index) => (
                  <MilestoneCommandItemSkeleton key={index} />
                ))}
              <div ref={setSentinelEl} className="h-1 w-full bg-transparent" />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const MilestoneCommandItemSkeleton = () => {
  return (
    <CommandItem disabled className="min-w-0" aria-hidden="true">
      <div className="flex w-full min-w-0 items-center gap-2">
        <Skeleton className="size-8 shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-44 max-w-full" />
        </div>
      </div>
    </CommandItem>
  );
};
