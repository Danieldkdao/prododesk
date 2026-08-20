import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { TasksBoardView } from "@/features/tasks/components/tasks-board-view";
import { TasksCalendarView } from "@/features/tasks/components/tasks-calendar-view";
import { TasksFilters } from "@/features/tasks/components/tasks-filters";
import { TasksListView } from "@/features/tasks/components/tasks-list-view";
import { SearchParamsType } from "@/lib/types";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const TasksPage = (props: SearchParamsType) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Tasks</h1>
        <TaskDialog>
          <Button>
            <PlusIcon />
            Create
          </Button>
        </TaskDialog>
      </div>
      <Suspense fallback={<AreaProjectTasksSkeleton />}>
        <TasksSuspense {...props} />
      </Suspense>
    </div>
  );
};

const TasksSuspense = (props: SearchParamsType) => {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue="list">
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <TasksFilters showAddButton={false} />
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

export default TasksPage;
