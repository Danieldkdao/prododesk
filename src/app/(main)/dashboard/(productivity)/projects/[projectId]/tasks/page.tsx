import { ErrorState } from "@/components/error-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { confirmUserProjectOwnership } from "@/features/projects/server/projects";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { TasksBoardView } from "@/features/tasks/components/tasks-board-view";
import { TasksCalendarView } from "@/features/tasks/components/tasks-calendar-view";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import { TasksListView } from "@/features/tasks/components/tasks-list-view";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdParams = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdTasksPage = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<AreaProjectTasksSkeleton />}>
      <ProjectIdTasksSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdTasksSuspense = async (props: ProjectIdParams) => {
  const { projectId } = await props.params;

  const existingProject = await confirmUserProjectOwnership(projectId);
  if (!existingProject)
    return (
      <ErrorState
        title="Project not found"
        description="We were unable to find the project you are looking for. Please check the URL and try again."
      />
    );

  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="list">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <TasksFilters defaultProject={existingProject} />
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="list">
          <TasksListView {...props} />
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

export default ProjectIdTasksPage;
