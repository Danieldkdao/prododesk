"use client";

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { readAreasAction, ReadAreasActionReturnType } from "../actions/actions";
import { useAreasParams } from "../hooks/use-areas-params";
import { AreaCard } from "./area-card";
import { AreaSkeleton } from "./areas-skeleton";
import { InfoCard } from "@/components/info-card";
import { SearchXIcon } from "lucide-react";

export const AreasInfiniteList = ({
  initialAreas,
  initialHasNextPage,
}: {
  initialAreas: ReadAreasActionReturnType["areas"];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useAreasParams();
  const { items: areas, isPending } = useInfiniteScroll<
    ReadAreasActionReturnType["areas"][number],
    "areas"
  >(
    initialAreas,
    initialHasNextPage,
    (nextPage) => readAreasAction({ ...filters, page: nextPage }),
    {
      additionalScrollDeps: [filters],
    },
  );
  return areas.length ? (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {areas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
        {isPending &&
          Array.from({ length: 8 }).map((_, index) => (
            <AreaSkeleton key={index} />
          ))}
      </div>
      <div className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <InfoCard
      title="No areas found"
      description="We were unable to find any areas. Create one to get started or update your search filters."
      icon={<SearchXIcon />}
    />
  );
};
