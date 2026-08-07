"use client";

import { NotFound } from "@/components/not-found";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useCallback } from "react";
import { readAreasAction, ReadAreasActionReturnType } from "../actions/actions";
import { useAreasParams } from "../hooks/use-areas-params";
import { AreaCard } from "./area-card";
import { AreaSkeleton } from "./areas-skeleton";

export const AreasInfiniteList = ({
  initialAreas,
  initialHasNextPage,
}: {
  initialAreas: ReadAreasActionReturnType["areas"];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useAreasParams();

  const fetchAreas = useCallback(
    (nextPage: number) => {
      return readAreasAction({ ...filters, page: nextPage });
    },
    [filters],
  );

  const {
    items: areas,
    isPending,
    setSentinelEl,
  } = useInfiniteScroll<ReadAreasActionReturnType["areas"][number], "areas">(
    initialAreas,
    initialHasNextPage,
    fetchAreas,
    {
      additionalScrollDeps: [filters],
    },
  );
  return areas.length ? (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areas.map((area) => (
          <AreaCard key={area.id} area={area} />
        ))}
        {isPending &&
          Array.from({ length: 8 }).map((_, index) => (
            <AreaSkeleton key={index} />
          ))}
      </div>
      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <NotFound
      title="No areas found"
      description="We were unable to find any areas. Create one to get started or update your search filters."
    />
  );
};
