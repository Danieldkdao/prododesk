"use client";

import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  readActivityAction,
  ReadActivityActionReturnType,
} from "../actions/actions";
import { useActivityParams } from "../hooks/use-activity-params";
import { ActivityListViews } from "./activity-list-views";

export const ActivityListTable = ({
  response,
  areaIds,
  projectIds,
  showProject = false,
}: {
  response: ReadActivityActionReturnType;
  areaIds?: string[];
  projectIds?: string[];
  showProject?: boolean;
}) => {
  const { activity: initialActivity, metadata } = response;

  const sentinelRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useActivityParams();
  const [activity, setActivity] = useState(initialActivity);
  const [cursor, setCursor] = useState(metadata.cursor);
  const [hasNextPage, setHasNextPage] = useState(metadata.hasNextPage);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !cursor || !hasNextPage || isPending) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;

        startTransition(async () => {
          const response = await readActivityAction({
            ...filters,
            areaIds,
            projectIds,
            cursor,
          });
          if (!response) return;

          const { activity: newActivity, metadata: newMetadata } = response;

          setActivity((prev) => [...prev, ...newActivity]);
          setCursor(newMetadata.cursor);
          setHasNextPage(newMetadata.hasNextPage);
        });
      },
      {
        rootMargin: "400px",
      },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [cursor, filters, hasNextPage, isPending, areaIds, projectIds]);

  const resetFilters = () => {
    setFilters({
      search: "",
      actions: [],
      sortBy: "most_recent",
      sources: [],
      subjects: [],
    });
  };

  return (
    <div>
      <div className="flex flex-col w-full">
        {activity.length ? (
          <ActivityListViews activity={activity} showProject={showProject} />
        ) : (
          <NotFound
            title="No activity found"
            description="We were unable to find any activity that match the selected filters. Try changing the filters or update this project."
          >
            <Button onClick={resetFilters} className="w-full" variant="outline">
              Reset filters
            </Button>
          </NotFound>
        )}
      </div>
      <div ref={sentinelRef} className="w-full h-px" />
    </div>
  );
};
