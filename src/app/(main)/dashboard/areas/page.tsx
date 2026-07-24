import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { readUserAreasAction } from "@/features/areas/actions/actions";
import { AreaDialog } from "@/features/areas/components/area-dialog";
import { Suspense } from "react";

const AreasPage = () => {
  return (
    <Suspense fallback={<AreasLoading />}>
      <AreasSuspense />
    </Suspense>
  );
};

const AreasLoading = () => {
  return <div>loading</div>;
};

const AreasSuspense = async () => {
  const areas = await readUserAreasAction();
  if (!areas) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your areas. Try again or come back later if the issue persists."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-20">
      <AreaDialog>
        <Button>Create</Button>
      </AreaDialog>
      <p className="text-muted-foreground">{JSON.stringify(areas)}</p>
    </div>
  );
};

export default AreasPage;
