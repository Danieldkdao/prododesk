"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { searchWorkspaceAction } from "../actions/actions";
import { resources } from "../lib/constants";
import { ResourceType } from "../lib/types";
import { formatResource, getResourceListElement } from "../lib/formatters";
import { useRouter } from "next/navigation";
import { SetterType } from "@/lib/types";
import { useDebouncedValue } from "@tanstack/react-pacer";

export const ResourcesCommandList = ({
  setOpen,
}: {
  setOpen: SetterType<boolean>;
}) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedResources, setSelectedResources] = useState<ResourceType[]>(
    [],
  );

  const debouncedSearch = useDebouncedValue(search, { wait: 500 })["0"];

  const { data, error, isPending } = useQuery({
    queryKey: ["searchWorkspace", debouncedSearch, selectedResources],
    queryFn: async () => {
      return searchWorkspaceAction({
        search: debouncedSearch,
        resources: selectedResources,
      });
    },
  });

  if (error)
    return (
      <div className="p-4 w-full flex items-center justify-center">
        <p className="text-base font-medium text-center text-destructive">
          Something went wrong. We were unable to load the resources in your
          workspace.
        </p>
      </div>
    );

  return (
    <Command
      shouldFilter={false}
      className="flex flex-col gap-2 min-w-0 w-full"
    >
      <CommandInput
        value={search}
        onValueChange={setSearch}
        placeholder="Search your workspace..."
      />
      <div className="w-full min-w-0 overflow-x-auto scrollbar-none">
        <div className="flex w-max min-w-full items-center justify-center gap-2 px-2">
          {resources.map((resource) => {
            const isSelected = selectedResources.includes(resource);
            const { label, icon: Icon } = formatResource(resource);

            return (
              <button
                type="button"
                key={resource}
                className={cn(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap bg-muted-foreground/10 px-2 py-1 text-muted-foreground transition-colors duration-200 hover:bg-muted-foreground/15 cursor-pointer",
                  isSelected &&
                    "bg-primary/10 text-primary hover:bg-primary/15",
                )}
                onClick={() => {
                  if (isSelected) {
                    setSelectedResources((prev) =>
                      prev.filter((r) => r !== resource),
                    );
                  } else {
                    setSelectedResources((prev) => [...prev, resource]);
                  }
                }}
              >
                <Icon className="size-5 shrink-0" />
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <CommandList>
        {isPending || !data ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            Searching workspace...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {resources.map((resource) => {
              const { label } = formatResource(resource);
              const items = (() => {
                switch (resource) {
                  case "areas":
                    return data.areas.map((item) =>
                      getResourceListElement({
                        resource,
                        item,
                        onSelect: (item) => {
                          router.push(`/dashboard/areas/${item.id}`);
                          setOpen(false);
                        },
                      }),
                    );
                  case "projects":
                    return data.projects.map((item) =>
                      getResourceListElement({
                        resource,
                        item,
                        onSelect: (item) => {
                          router.push(`/dashboard/projects/${item.id}`);
                          setOpen(false);
                        },
                      }),
                    );
                  case "tasks":
                    return data.tasks.map((item) =>
                      getResourceListElement({
                        resource,
                        item,
                        onSelect: (item) => {
                          router.push(
                            `/dashboard/projects${item.projectId ? `/${item.projectId}/tasks` : ""}`,
                          );
                          setOpen(false);
                        },
                      }),
                    );
                  case "milestones":
                    return data.milestones.map((item) =>
                      getResourceListElement({
                        resource,
                        item,
                        onSelect: (item) => {
                          router.push(
                            `/dashboard/projects/${item.projectId}/milestones`,
                          );
                          setOpen(false);
                        },
                      }),
                    );
                  case "documents":
                    return data.documents.map((item) =>
                      getResourceListElement({
                        resource,
                        item,
                        onSelect: (item) => {
                          router.push(`/dashboard/documents/${item.id}`);
                          setOpen(false);
                        },
                      }),
                    );
                  case "chats":
                    return data.chats.map((item) =>
                      getResourceListElement({
                        resource,
                        item,
                        onSelect: (item) => {
                          router.push(`/dashboard/ai/chat/${item.id}`);
                          setOpen(false);
                        },
                      }),
                    );
                  default:
                    throw new Error(
                      `Unknown resource type: ${resource satisfies never}`,
                    );
                }
              })();

              if (!items.length) return null;

              return (
                <CommandGroup
                  key={resource}
                  className="flex flex-col gap-1"
                  heading={label}
                >
                  <div className="flex flex-col gap-1">{items}</div>
                </CommandGroup>
              );
            })}
            <CommandEmpty>No matching resources found.</CommandEmpty>
          </div>
        )}
      </CommandList>
    </Command>
  );
};
