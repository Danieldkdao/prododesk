import { sql, type SQLWrapper } from "drizzle-orm";

export const taskPriorityRank = (priority: SQLWrapper) => sql`
  CASE ${priority}
    WHEN 'urgent' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END
`;

export const taskDueDateOrder = (dueAt: SQLWrapper) =>
  sql`${dueAt} ASC NULLS LAST`;
