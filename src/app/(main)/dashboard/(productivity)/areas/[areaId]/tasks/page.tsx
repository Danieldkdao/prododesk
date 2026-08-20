import { ErrorState } from "@/components/error-state";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { confirmUserAreaOwnership } from "@/features/areas/server/areas";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { TasksBoardView } from "@/features/tasks/components/tasks-board-view";
import { TasksCalendarView } from "@/features/tasks/components/tasks-calendar-view";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import { TasksListView } from "@/features/tasks/components/tasks-list-view";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type AreaIdTasksParams = ParamsId<"areaId"> & SearchParamsType;

const AreaIdTasksPage = (props: AreaIdTasksParams) => {
  return (
    <Suspense fallback={<AreaProjectTasksSkeleton showProject />}>
      <AreaIdTasksSuspense {...props} />
    </Suspense>
  );
};

const AreaIdTasksSuspense = async (props: AreaIdTasksParams) => {
  const { areaId } = await props.params;

  const existingArea = await confirmUserAreaOwnership(areaId);
  if (!existingArea)
    return (
      <ErrorState
        title="Area not found"
        description="We were unable to find the area you are looking for. Please check the URL and try again."
      />
    );

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="list">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <TasksFilters />
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="list">
          <TasksListView showProject {...props} />
        </TabsContent>
        <TabsContent value="board">
          <TasksBoardView {...props} />
        </TabsContent>
        <TabsContent value="calendar">
          <TasksCalendarView {...props} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AreaIdTasksPage;
