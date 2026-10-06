"use client";

import { InfiniteScrollError } from "@/components/infinite-scroll-error";

import { TooltipWrapper } from "@/components/tooltip-wrapper";
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
import { AreaSelectType } from "@/db/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import { formatArchivedStatus, formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, ShapesIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { readAreasAction } from "../actions/actions";

export const AreaCommandSelect = ({
  id,
  fieldError,
  initialValue,
  value,
  onValueChange,
}: {
  id?: string;
  fieldError?: boolean;
  initialValue?: { name: string; icon?: string | null } | null | undefined;
  value?: string | null | undefined;
  onValueChange: (value: unknown) => void;
}) => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<AreaSelectType | null>(null);
  const isSearchPending = search !== query;

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchAreas = useCallback(
    (nextPage: number) => {
      return readAreasAction({
        search: query,
        sortBy: "recently_created",
        archiveStatus: "active",
        colors: [],
        page: nextPage,
      });
    },
    [query],
  );

  const {
    items: areas,
    isPending: isInfinitePending,
    hasNextPage,
    setContainerEl,
    error,
    retry,
    setSentinelEl,
  } = useInfiniteScroll<AreaSelectType, "areas">([], true, fetchAreas, {
    resetKey: query,
    enabled: commandOpen && !isSearchPending,
    defaultPage: DEFAULT_PAGE - 1,
  });

  const selectedArea =
    areas.find((area) => area.id === value) ??
    (selection?.id === value ? selection : null);

  return (
    <Popover
      open={commandOpen}
      onOpenChange={(open) => {
        setCommandOpen(open);
        if (!open) {
          setSearch("");
          setQuery("");
        }
      }}
    >
      <PopoverTrigger
        id={id}
        aria-invalid={!!fieldError}
        className="border-b cursor-pointer h-11 flex items-center gap-2 w-full min-w-0"
      >
        <div className="min-w-0 flex-1 flex items-center">
          {selectedArea ? (
            <div className="flex min-w-0 items-center gap-2">
              {selectedArea.icon ? (
                <span className="shrink-0">{selectedArea.icon}</span>
              ) : (
                <ShapesIcon className="size-4 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {selectedArea.name}
              </span>
            </div>
          ) : initialValue && value ? (
            <div className="flex min-w-0 items-center gap-2">
              {initialValue?.icon ? (
                <span className="shrink-0">{initialValue.icon}</span>
              ) : (
                <ShapesIcon className="size-4 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {initialValue.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">No area selected</span>
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
            }}
            placeholder="Search for areas by name or description..."
          />

          <CommandList ref={setContainerEl}>
            {!error &&
              !isSearchPending &&
              !isInfinitePending &&
              !hasNextPage && <CommandEmpty>No areas found.</CommandEmpty>}
            <CommandGroup>
              {isSearchPending
                ? Array.from({ length: 4 }).map((_, index) => (
                    <AreaCommandItemSkeleton key={index} />
                  ))
                : areas.map((area) => {
                    const { icon: StatusIcon } = formatArchivedStatus(
                      area.isArchived,
                    );
                    const isSelected = area.id === selectedArea?.id;

                    return (
                      <CommandItem
                        key={area.id}
                        value={area.id}
                        className={cn(
                          "min-w-0",
                          isSelected &&
                            "bg-primary/15 hover:bg-primary/10 data-selected:bg-primary/10",
                        )}
                        onSelect={() => {
                          setSelection(isSelected ? null : area);
                          onValueChange(isSelected ? null : area.id);
                          setCommandOpen(false);
                          setSearch("");
                          setQuery("");
                        }}
                      >
                        <TooltipWrapper
                          content={`This area is ${area.isArchived ? "archived" : "active"}`}
                        >
                          <div className="flex w-full min-w-0 items-center gap-2">
                            <div
                              className={cn(
                                "flex size-8 shrink-0 items-center justify-center rounded-md",
                                area.color && formatColor(area.color).bgLight,
                              )}
                            >
                              {area.icon ? (
                                <span>{area.icon}</span>
                              ) : (
                                <ShapesIcon className="text-muted-foreground size-4" />
                              )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-px">
                              <div className="flex items-center gap-2 min-w-0 flex-1 w-full">
                                <span className="truncate text-base font-medium">
                                  {area.name}
                                </span>

                                <StatusIcon
                                  className={
                                    area.isArchived
                                      ? "text-muted-foreground"
                                      : "text-emerald-500"
                                  }
                                />
                              </div>

                              <span
                                className={cn(
                                  "truncate text-xs text-muted-foreground",
                                  !area.description && "italic",
                                )}
                              >
                                {area.description || "No description provided."}
                              </span>
                            </div>
                          </div>
                        </TooltipWrapper>
                      </CommandItem>
                    );
                  })}
              {isInfinitePending &&
                Array.from({ length: 4 }).map((_, index) => (
                  <AreaCommandItemSkeleton key={index} />
                ))}
              <InfiniteScrollError error={error} retry={retry} />
              <div ref={setSentinelEl} className="h-1 w-full bg-transparent" />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const AreaCommandItemSkeleton = () => {
  return (
    <CommandItem disabled className="min-w-0">
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
