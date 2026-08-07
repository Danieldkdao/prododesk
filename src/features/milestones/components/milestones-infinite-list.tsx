"use client";

import { NotFound } from "@/components/not-found";
import { ProjectSelectType, TaskSelectType } from "@/db/schema";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useCallback } from "react";
import {
  readProjectMilestonesAction,
  ReadProjectMilestonesActionType,
} from "../actions/actions";
import { useMilestonesParams } from "../hooks/use-milestones-params";
import { MilestoneCard } from "./milestone-card";
import { SetterType } from "@/lib/types";
import { MilestoneSkeleton } from "./milestones-skeleton";

export const MilestonesInfiniteList = ({
  projectId,
  milestones,
  setMilestones,
  initialHasNextPage,
  tasksState,
}: {
  projectId: string;
  milestones: ReadProjectMilestonesActionType["milestones"];
  setMilestones: SetterType<ReadProjectMilestonesActionType["milestones"]>;
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
    items: milestonesToUse,
    setSentinelEl,
    isPending,
  } = useInfiniteScroll<
    ReadProjectMilestonesActionType["milestones"][number],
    "milestones"
  >(milestones, initialHasNextPage, fetchMilestones, {
    additionalScrollDeps: [filters],
    ownState: {
      values: milestones,
      setValues: setMilestones,
    },
  });

  return milestonesToUse.length ? (
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
              index={index}
              isLast={index === milestones.length - 1}
            />
          );
        })}
      </div>
      {isPending &&
        Array.from({ length: 4 }).map((_, index) => (
          <MilestoneSkeleton key={index} isLast={index === 3} />
        ))}
      <div ref={setSentinelEl} className="h-1 w-full bg-transparent" />
    </div>
  ) : (
    <NotFound
      title="No milestones found"
      description="We weren't able to find any milestones that match the selected filters. Create a new milestone to get started or update your search filters."
    />
  );
};
