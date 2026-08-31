import { TaskTable } from "@/db/schema";
import { sql } from "drizzle-orm";

export const taskPriorityRank = sql`
  CASE ${TaskTable.priority}
    WHEN 'urgent' THEN 1 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
    WHEN 'high' THEN 2 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
    WHEN 'medium' THEN 3 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
    WHEN 'low' THEN 4 * EXTRACT(EPOCH FROM ${TaskTable.dueAt})
    ELSE 5
  END
`;
