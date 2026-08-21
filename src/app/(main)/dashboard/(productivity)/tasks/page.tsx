import { Button } from "@/components/ui/button";
import { AreaProjectTasksSkeleton } from "@/features/tasks/components/area-project-tasks-skeleton";
import { TaskDialog } from "@/features/tasks/components/task-dialog";
import { TasksView } from "@/features/tasks/components/tasks-view";
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
      <Suspense
        fallback={
          <AreaProjectTasksSkeleton showProject showAddButton={false} />
        }
      >
        <TasksView showProject {...props} />
      </Suspense>
    </div>
  );
};

export default TasksPage;
