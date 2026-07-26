import { ErrorState } from "@/components/error-state";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { readUserAreasAction } from "@/features/areas/actions/actions";
import { AreaCard } from "@/features/areas/components/area-card";
import { AreaDialog } from "@/features/areas/components/area-dialog";
import { DEFAULT_PAGE } from "@/lib/constants";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const AreasPage = () => {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-10 max-w-384 mx-auto">
        <div className="flex items-center gap-2 flex-wrap justify-between">
          <h1 className="text-3xl font-semibold">My Areas</h1>
          <AreaDialog>
            <TooltipWrapper content="Create new area">
              <Button size="icon-sm">
                <PlusIcon />
              </Button>
            </TooltipWrapper>
          </AreaDialog>
        </div>
        <Suspense fallback={<AreasLoading />}>
          <AreasSuspense />
        </Suspense>
      </div>
    </div>
  );
};

const AreasLoading = () => {
  return (
    <div className="mx-auto flex w-full max-w-384 flex-col gap-4 p-10">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="size-9" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-52 w-full flex-col border border-l-6 p-6"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="size-10 shrink-0" />
                <Skeleton className="h-7 w-28" />
              </div>
              <Skeleton className="size-8 shrink-0" />
            </div>
            <div className="mt-6 space-y-2">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-4/5" />
            </div>
            <div className="mt-auto pt-6">
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AreasSuspense = async () => {
  // todo: add proper filters
  const response = await readUserAreasAction({
    search: "",
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

  const { areas } = response;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {areas.map((area) => (
        <AreaCard key={area.id} area={area} />
      ))}
    </div>
  );
};

export default AreasPage;
