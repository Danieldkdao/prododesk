"use server";

import { db } from "@/db/db";
import { TaskSelectType, TaskTable } from "@/db/schema";
import { milestoneTools } from "@/features/milestones/ai/tools";
import { projectTools } from "@/features/projects/ai/tools";
import { readProjectsDb } from "@/features/projects/server/projects";
import { taskPriorityRank } from "@/features/tasks/lib/helpers";
import { getUserTaskTag } from "@/features/tasks/server/cache/tasks";
import { confirmUserTaskOwnership } from "@/features/tasks/server/tasks";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { getLocalDayBounds, isError } from "@/lib/utils";
import { openrouter } from "@/services/ai/models/openrouter";
import {
  GENERATE_TRIAGE_SUGGESTIONS_INSTRUCTIONS,
  GENERATE_TRIAGE_SUGGESTIONS_PROMPT,
} from "@/services/ai/prompts";
import { tz, TZDate } from "@date-fns/tz";
import { generateText, Output } from "ai";
import { format, parse, subDays } from "date-fns";
import { and, asc, eq, gte, isNull, lte, ne, or } from "drizzle-orm";
import { cacheTag } from "next/cache";
import { triageSuggestionSchema } from "../ai/schemas";
import {
  MAX_PROJECT_PROMPT_INJECTION_LIMIT,
  TRIAGE_TASK_LIMIT,
} from "../lib/constants";
import {
  PlannerCardState,
  PlannerCounts,
  SingleTaskSource,
  TriageSuggestion,
} from "../lib/types";
import { getPlannerCardState } from "../lib/utils";

const readCachedPlanMyDayDataAction = async (
  userId: string,
  timeZone: string,
  date: string,
): Promise<
  | {
      [S in PlannerCardState]: S extends "single"
        ? PlannerCounts & {
            state: S;
            source: SingleTaskSource;
            singleTask: TaskSelectType;
          }
        : PlannerCounts & { state: S };
    }[PlannerCardState]
  | null
> => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const dateToUse = parse(date, "yyyy-MM-dd", TZDate.tz(timeZone), {
    in: tz(timeZone),
  });
  const { startUtc, endUtc } = getLocalDayBounds(dateToUse, timeZone);
  const threeDaysAgo = subDays(startUtc, 3);

  const [todayTasks, tasksNeedAttention, unsortedTasks] = await Promise.all([
    db
      .select()
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          or(
            and(
              gte(TaskTable.scheduledAt, startUtc),
              lte(TaskTable.scheduledAt, endUtc),
            ),
            and(gte(TaskTable.dueAt, startUtc), lte(TaskTable.dueAt, endUtc)),
          ),
        ),
      ),
    db
      .select()
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          or(
            lte(TaskTable.scheduledAt, startUtc),
            lte(TaskTable.dueAt, startUtc),
          ),
          ne(TaskTable.status, "completed"),
        ),
      ),
    db
      .select()
      .from(TaskTable)
      .where(
        and(
          isNull(TaskTable.scheduledAt),
          isNull(TaskTable.dueAt),
          isNull(TaskTable.projectId),
          isNull(TaskTable.milestoneId),
          lte(TaskTable.createdAt, threeDaysAgo),
          eq(TaskTable.userId, userId),
        ),
      ),
  ]);

  const todayTaskCount = todayTasks.length;
  const tasksNeedAttentionCount = tasksNeedAttention.length;
  const unsortedTaskCount = unsortedTasks.length;

  const counts = {
    todayTaskCount,
    tasksNeedAttentionCount,
    unsortedTaskCount,
  };

  const plannerState = getPlannerCardState(counts);

  let singleTask: TaskSelectType | null = null;

  if (plannerState.state === "single") {
    const source = plannerState.source;
    switch (source) {
      case "attention":
        singleTask = tasksNeedAttention?.[0] ?? null;
        break;
      case "today":
        singleTask = todayTasks?.[0] ?? null;
        break;
      case "unsorted":
        singleTask = unsortedTasks?.[0] ?? null;
        break;
      default:
        throw new Error(
          `Unknown single task source: ${source satisfies never}`,
        );
    }
  }
  return plannerState.state === "single"
    ? singleTask
      ? {
          ...counts,
          ...plannerState,
          singleTask,
        }
      : null
    : {
        ...counts,
        ...plannerState,
      };
};
export const readPlanMyDayDataAction = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  const today = format(new Date(), "yyyy-MM-dd", {
    in: tz(user.timeZone),
  });

  return readCachedPlanMyDayDataAction(userId, user.timeZone, today);
};

const readCachedTriageCandidatesAction = async (
  userId: string,
  timeZone: string,
  date: string,
) => {
  "use cache";
  cacheTag(getUserTaskTag(userId));

  const dateToUse = parse(date, "yyyy-MM-dd", TZDate.tz(timeZone), {
    in: tz(timeZone),
  });
  const { startUtc } = getLocalDayBounds(dateToUse, timeZone);
  const threeDaysAgo = subDays(startUtc, 3);

  const unsortedTasks = db
    .select()
    .from(TaskTable)
    .where(
      and(
        isNull(TaskTable.scheduledAt),
        isNull(TaskTable.dueAt),
        isNull(TaskTable.projectId),
        isNull(TaskTable.milestoneId),
        lte(TaskTable.createdAt, threeDaysAgo),
        eq(TaskTable.userId, userId),
      ),
    )
    .orderBy(taskPriorityRank, asc(TaskTable.id))
    .limit(TRIAGE_TASK_LIMIT);

  return unsortedTasks;
};
export const readTriageCandidatesAction = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  const today = format(new Date(), "yyyy-MM-dd", {
    in: tz(user.timeZone),
  });

  return readCachedTriageCandidatesAction(userId, user.timeZone, today);
};
export type ReadTriageCandidatesActionReturnType = UnwrapAsync<
  typeof readTriageCandidatesAction
>;

export const generateTriageSuggestionsAction = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const triageCandidates = await readTriageCandidatesAction();
  if (!triageCandidates) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const taskIds = triageCandidates.map((candidate) => candidate.id);

  const existingTasks = (
    await Promise.all(taskIds.map((taskId) => confirmUserTaskOwnership(taskId)))
  ).filter((task): task is TaskSelectType => Boolean(task));
  if (existingTasks.length !== taskIds.length || !existingTasks.length) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const response = await readProjectsDb({
    userId,
    limit: MAX_PROJECT_PROMPT_INJECTION_LIMIT + 1,
  });
  if (!response) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const { projects } = response;

  try {
    const { output } = await generateText({
      model: openrouter("z-ai/glm-5.3-flash"),
      output: Output.array({
        element: triageSuggestionSchema,
      }),
      prompt: GENERATE_TRIAGE_SUGGESTIONS_PROMPT({
        tasks: existingTasks,
        projects:
          projects.length === MAX_PROJECT_PROMPT_INJECTION_LIMIT + 1
            ? undefined
            : projects,
        timeZone: user.timeZone,
      }),
      instructions: GENERATE_TRIAGE_SUGGESTIONS_INSTRUCTIONS,
      tools: {
        readProjects: projectTools.readProjects,
        readMilestones: milestoneTools.readMilestones,
      },
    });

    const outputWithTasks = output
      .map((suggestion) => ({
        ...suggestion,
        task: triageCandidates.find(
          (candidate) => candidate.id === suggestion.taskId,
        ),
      }))
      .filter((suggestion): suggestion is TriageSuggestion =>
        Boolean(suggestion.task),
      );
    if (outputWithTasks.length !== output.length)
      throw new Error(GENERAL_ERROR_MESSAGE);

    return {
      error: false,
      message: "Triage suggestions generated successfully!",
      output: outputWithTasks,
    };
  } catch (error) {
    const errorMessage = isError(error) ? error.message : GENERAL_ERROR_MESSAGE;
    console.error(error);
    return {
      error: true,
      message: errorMessage,
    };
  }
};
