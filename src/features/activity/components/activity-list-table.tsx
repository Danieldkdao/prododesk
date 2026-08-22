"use client";

import { NotFound } from "@/components/not-found";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  readActivityAction,
  ReadActivityActionReturnType,
} from "../actions/actions";
import { useActivityParams } from "../hooks/use-activity-params";
import { ActivityTableRow } from "./activity-table-row";
import { useEffect, useRef, useState, useTransition } from "react";
import { ActivitySkeleton } from "./activity-skeleton";
import { PAGE_SIZE } from "@/lib/constants";

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
          <Table>
            <TableHeader>
              <TableRow>
                {showProject && <TableHead>Project</TableHead>}
                <TableHead>Activity</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activity.map((a) => (
                <ActivityTableRow
                  key={a.id}
                  activity={a}
                  showProject={showProject}
                />
              ))}
              {isPending &&
                Array.from({ length: PAGE_SIZE }).map((_, index) => (
                  <ActivitySkeleton
                    key={index}
                    showProject={showProject}
                    index={index}
                  />
                ))}
            </TableBody>
          </Table>
        ) : (
          <NotFound
            title="No activity found"
            description="We were unable to find any activity that match the selected filters. Try changing the filters or update this project."
          >
            <Button onClick={resetFilters} className="w-full">
              Reset filters
            </Button>
          </NotFound>
        )}
      </div>
      <div ref={sentinelRef} className="w-full h-px" />
    </div>
  );
};
