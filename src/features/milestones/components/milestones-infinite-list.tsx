"use client";

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import {
  readProjectMilestonesAction,
  ReadProjectMilestonesActionType,
} from "../actions/actions";
import { useMilestonesParams } from "../hooks/use-milestones-params";
import { MilestoneCard } from "./milestone-card";
import { InfoCard } from "@/components/info-card";
import { SearchXIcon } from "lucide-react";

export const MilestonesInfiniteList = ({
  projectId,
  initialMilestones,
  initialHasNextPage,
}: {
  projectId: string;
  initialMilestones: ReadProjectMilestonesActionType["milestones"];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useMilestonesParams();
  const { items: milestones, isPending } = useInfiniteScroll<
    ReadProjectMilestonesActionType["milestones"][number],
    "milestones"
  >(
    initialMilestones,
    initialHasNextPage,
    (nextPage) =>
      readProjectMilestonesAction(projectId, { ...filters, page: nextPage }),
    {
      additionalScrollDeps: [filters],
    },
  );

  return milestones.length ? (
    <div>
      <div className="flex flex-col gap-4 w-full min-w-0">
        {milestones.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} />
        ))}
      </div>
    </div>
  ) : (
    <InfoCard
      title="No milestones found"
      description="We weren't able to find any milestones that match the selected filters. Create a new milestone to get started or update your search filters."
      icon={<SearchXIcon />}
    />
  );
};
