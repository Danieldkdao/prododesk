import { SearchParamsType } from "@/lib/types";
import { TaskViewTab } from "../lib/types";
import { TaskViewTabs } from "./task-view-tabs";
import { TasksBoardView } from "./tasks-board-view";
import { TasksCalendarView } from "./tasks-calendar-view";
import { TasksFilters } from "./tasks-filters";
import { TasksListView } from "./tasks-list-view";
import { DEFAULT_TAB_VALUE } from "../lib/constants";

export const TasksView = async ({
  showFilterAddButton = false,
  showProject = false,
  ...props
}: SearchParamsType & {
  showFilterAddButton?: boolean;
  showProject?: boolean;
}) => {
  const searchParams = await props.searchParams;

  const tab = (searchParams?.tab || DEFAULT_TAB_VALUE) as TaskViewTab;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <TasksFilters showAddButton={showFilterAddButton} />
        <TaskViewTabs value={tab} />
      </div>
      {tab === "list" && <TasksListView showProject={showProject} {...props} />}
      {tab === "board" && <TasksBoardView {...props} />}
      {tab === "calendar" && <TasksCalendarView {...props} />}
    </div>
  );
};
