import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TaskSelectType } from "@/db/schema";
import { OverviewTasksTableRow } from "./overview-tasks-table-row";

export const OverviewTasksTable = ({ tasks }: { tasks: TaskSelectType[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Task</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Priority</TableHead>
          <TableHead className="text-center">Due</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => (
          <OverviewTasksTableRow key={task.id} task={task} />
        ))}
      </TableBody>
    </Table>
  );
};
