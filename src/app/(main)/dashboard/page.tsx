import { ErrorState } from "@/components/error-state";
import { StatsSection } from "@/features/dashboard/components/stats-section";
import { getCurrentUser } from "@/lib/auth/helpers";
import { Suspense } from "react";

const DashboardPage = () => {
  return (
    <div className="w-full h-full overflow-y-auto">
      <div className="flex flex-col gap-4 p-10 max-w-384 mx-auto">
        <Suspense fallback={<DashboardLoading />}>
          <DashboardSuspense />
        </Suspense>
      </div>
    </div>
  );
};

const DashboardLoading = () => {
  return <div>loading</div>;
};

const DashboardSuspense = async () => {
  const { user } = await getCurrentUser();
  if (!user)
    return (
      <ErrorState
        title="No access"
        description="Please sign in to view this page"
      />
    );

  return (
    <div className="w-full min-w-0 flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">
          Welcome, {user.name.split(" ").at(0)}.
        </h1>
        <p className="text-muted-foreground text-xl">
          What would you like to work on today?
        </p>
      </div>
      <StatsSection />
    </div>
  );
};

export default DashboardPage;
