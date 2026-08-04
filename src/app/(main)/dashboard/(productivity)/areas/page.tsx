import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { readAreasAction } from "@/features/areas/actions/actions";
import { AreaDialog } from "@/features/areas/components/area-dialog";
import { AreasFilters } from "@/features/areas/components/areas-filters";
import { AreasInfiniteList } from "@/features/areas/components/areas-infinite-list";
import { AreasSkeleton } from "@/features/areas/components/areas-skeleton";
import { loadAreasSearchParams } from "@/features/areas/lib/areas-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParamsType } from "@/lib/types";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const AreasPage = (props: SearchParamsType) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Areas</h1>
        <AreaDialog>
          <Button>
            <PlusIcon />
            Create
          </Button>
        </AreaDialog>
      </div>
      <Suspense fallback={<AreasSkeleton />}>
        <AreasSuspense {...props} />
      </Suspense>
    </div>
  );
};

const AreasSuspense = async ({ searchParams }: SearchParamsType) => {
  const filters = await loadAreasSearchParams(searchParams);
  const response = await readAreasAction({
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your areas. Try again or come back later if the issue persists."
      />
    );
  }

  const { areas, metadata } = response;

  return (
    <div className="flex flex-col gap-8">
      <AreasFilters />
      <AreasInfiniteList
        key={metadata.clientKey}
        initialAreas={areas}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default AreasPage;
