"use client";

import { NotFound } from "@/components/not-found";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useCallback } from "react";
import {
  readProjectMilestonesAction,
  ReadProjectMilestonesActionType,
} from "../actions/actions";
import { useMilestonesParams } from "../hooks/use-milestones-params";
import { MilestoneCard } from "./milestone-card";
import { ProjectSelectType, TaskSelectType } from "@/db/schema";

export const MilestonesInfiniteList = ({
  projectId,
  initialMilestones,
  initialHasNextPage,
  tasksState,
}: {
  projectId: string;
  initialMilestones: ReadProjectMilestonesActionType["milestones"];
  initialHasNextPage: boolean;
  tasksState: (TaskSelectType & { project: ProjectSelectType | null })[];
}) => {
  const [filters] = useMilestonesParams();

  const fetchMilestones = useCallback(
    (nextPage: number) => {
      return readProjectMilestonesAction(projectId, {
        ...filters,
        page: nextPage,
      });
    },
    [projectId, filters],
  );

  const {
    items: milestones,
    setSentinelEl,
    isPending,
  } = useInfiniteScroll<
    ReadProjectMilestonesActionType["milestones"][number],
    "milestones"
  >(initialMilestones, initialHasNextPage, fetchMilestones, {
    additionalScrollDeps: [filters],
  });

  return milestones.length ? (
    <div>
      <div className="flex flex-col w-full min-w-0">
        {milestones.map((milestone, index) => {
          const milestoneTasks = tasksState.filter(
            (task) => task.milestoneId === milestone.id,
          );

          return (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              tasks={milestoneTasks}
              isLast={index === milestones.length - 1}
            />
          );
        })}
      </div>
      {isPending && <div>loading more</div>}
      <div ref={setSentinelEl} className="h-1 w-full bg-transparent" />
    </div>
  ) : (
    <NotFound
      title="No milestones found"
      description="We weren't able to find any milestones that match the selected filters. Create a new milestone to get started or update your search filters."
    />
  );
};
