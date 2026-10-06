"use client";

import { InfiniteScrollError } from "@/components/infinite-scroll-error";

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
import { ProjectSelectType } from "@/db/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { DEFAULT_PAGE } from "@/lib/constants";
import { formatArchivedStatus, formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, FolderKanbanIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { readProjectsAction } from "../actions/actions";

export const ProjectCommandSelect = ({
  id,
  fieldError,
  initialProject,
  value: value,
  onValueChange,
  className,
  disabled = false,
}: {
  id?: string;
  fieldError?: boolean;
  initialProject?: { name: string; icon?: string | null } | null;
  value?: string | null | undefined;
  onValueChange: (value: string | null) => void;
  className?: string;
  disabled?: boolean;
}) => {
  const [commandOpen, setCommandOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<ProjectSelectType | null>(null);
  const isSearchPending = search !== query;

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProjects = useCallback(
    (nextPage: number) => {
      return readProjectsAction({
        search: query,
        archiveStatus: "active",
        colors: [],
        sortBy: "recently_created",
        statuses: [],
        dateTimeEndRange: null,
        dateTimeStartRange: null,
        page: nextPage,
      });
    },
    [query],
  );

  const {
    items: projects,
    isPending: isInfinitePending,
    hasNextPage,
    error,
    retry,
    setSentinelEl,
    setContainerEl,
  } = useInfiniteScroll<ProjectSelectType, "projects">(
    [],
    true,
    fetchProjects,
    {
      resetKey: query,
      enabled: commandOpen && !isSearchPending,
      defaultPage: DEFAULT_PAGE - 1,
    },
  );

  const selectedProject =
    projects.find((project) => project.id === value) ??
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
        className={cn(
          "border-b cursor-pointer h-11 flex items-center gap-2 w-full min-w-0",
          className,
        )}
        disabled={disabled}
      >
        <div className="min-w-0 flex-1 flex items-center">
          {selectedProject ? (
            <div className="flex min-w-0 items-center gap-2">
              {selectedProject.icon ? (
                <span className="shrink-0">{selectedProject.icon}</span>
              ) : (
                <FolderKanbanIcon className="size-4 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {selectedProject.name}
              </span>
            </div>
          ) : initialProject && value ? (
            <div className="flex min-w-0 items-center gap-2">
              {initialProject?.icon ? (
                <span className="shrink-0">{initialProject.icon}</span>
              ) : (
                <FolderKanbanIcon className="size-4 text-muted-foreground" />
              )}
              <span className="min-w-0 flex-1 truncate">
                {initialProject.name}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">No project selected</span>
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
            placeholder="Search for projects by name, description, or associated area..."
          />

          <CommandList ref={setContainerEl}>
            {!error &&
              !isSearchPending &&
              !isInfinitePending &&
              !hasNextPage && <CommandEmpty>No projects found.</CommandEmpty>}
            <CommandGroup>
              {isSearchPending
                ? Array.from({ length: 4 }).map((_, index) => (
                    <ProjectCommandItemSkeleton key={index} />
                  ))
                : projects.map((project) => {
                    const { icon: StatusIcon } = formatArchivedStatus(
                      project.isArchived,
                    );
                    const isSelected = project.id === selectedProject?.id;

                    return (
                      <CommandItem
                        key={project.id}
                        value={project.id}
                        className={cn(
                          "min-w-0",
                          isSelected &&
                            "bg-primary/15 hover:bg-primary/10 data-selected:bg-primary/10",
                        )}
                        onSelect={() => {
                          setSelection(isSelected ? null : project);
                          onValueChange(isSelected ? null : project.id);
                          setCommandOpen(false);
                          setSearch("");
                          setQuery("");
                        }}
                      >
                        <div className="flex w-full min-w-0 items-center gap-2">
                          <div
                            className={cn(
                              "flex size-8 shrink-0 items-center justify-center rounded-md",
                              project.color &&
                                formatColor(project.color).bgLight,
                            )}
                          >
                            {project.icon ? (
                              <span>{project.icon}</span>
                            ) : (
                              <FolderKanbanIcon className="text-muted-foreground size-4" />
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col gap-px">
                            <div className="flex items-center gap-2 min-w-0 flex-1 w-full">
                              <span className="truncate text-base font-medium">
                                {project.name}
                              </span>

                              <StatusIcon
                                className={
                                  project.isArchived
                                    ? "text-muted-foreground"
                                    : "text-emerald-500"
                                }
                              />
                            </div>
                            <span
                              className={cn(
                                "truncate text-xs text-muted-foreground",
                                !project.outcome && "italic",
                              )}
                            >
                              {project.outcome || "No description provided."}
                            </span>
                          </div>
                        </div>
                      </CommandItem>
                    );
                  })}
              {isInfinitePending &&
                Array.from({ length: 4 }).map((_, index) => (
                  <ProjectCommandItemSkeleton key={index} />
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

const ProjectCommandItemSkeleton = () => {
  return (
    <CommandItem
      className="flex min-w-0 items-center gap-2 px-2 py-1.5"
      aria-hidden="true"
    >
      <Skeleton className="size-8 shrink-0 rounded-md" />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="size-4 shrink-0 rounded-full" />
        </div>

        <Skeleton className="h-3 w-44 max-w-full" />
      </div>
    </CommandItem>
  );
};
