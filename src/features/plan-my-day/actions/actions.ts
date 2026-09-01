"use server";

import { db } from "@/db/db";
import {
  DailyPlanEnergyLevel,
  DailyPlanItemTable,
  DailyPlanTable,
  TaskSelectType,
  TaskTable,
} from "@/db/schema";
import { milestoneTools } from "@/features/milestones/ai/tools";
import { confirmUserMilestoneOwnership } from "@/features/milestones/server/milestones";
import { projectTools } from "@/features/projects/ai/tools";
import {
  confirmUserProjectOwnership,
  readProjectsDb,
} from "@/features/projects/server/projects";
import { taskPriorityRank } from "@/features/tasks/lib/helpers";
import { getUserTaskTag } from "@/features/tasks/server/cache/tasks";
import {
  confirmUserTaskOwnership,
  updateTaskDb,
} from "@/features/tasks/server/tasks";
import { taskSchema, updateTaskSchema } from "@/features/tasks/actions/schemas";
import { getCurrentUser } from "@/lib/auth/helpers";
import {
  GENERAL_ERROR_MESSAGE,
  INVALID_DATA_ERROR_MESSAGE,
  NOT_FOUND_ERROR_MESSAGE,
  UNAUTHED_ERROR_MESSAGE,
} from "@/lib/constants";
import { UnwrapAsync } from "@/lib/types";
import { getLocalDayBounds, isError } from "@/lib/utils";
import { openrouter } from "@/services/ai/models/openrouter";
import {
  GENERATE_DAILY_PLAN_INSTRUCTIONS,
  GENERATE_DAILY_PLAN_PROMPT,
  GENERATE_TRIAGE_SUGGESTIONS_INSTRUCTIONS,
  GENERATE_TRIAGE_SUGGESTIONS_PROMPT,
} from "@/services/ai/prompts";
import { tz, TZDate } from "@date-fns/tz";
import { generateText, Output } from "ai";
import { format, parse, parseISO, subDays } from "date-fns";
import {
  and,
  asc,
  eq,
  gte,
  getTableColumns,
  inArray,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import { cacheTag } from "next/cache";
import {
  dailyPlanDraftSchema,
  DailyPlanDraftSchemaType,
  generatedDailyPlanSchema,
  GeneratedDailyPlanSchemaType,
  triageSuggestionSchema,
} from "../ai/schemas";
import {
  MAX_PLAN_CANDIDATES,
  MAX_PLAN_ITEMS,
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
import {
  planMyDaySchema,
  PlanMyDaySchemaType,
  suggestionAnswerSchema,
  SuggestionAnswerSchemaType,
} from "./schemas";

export const readDayPlanAction = async () => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) return null;

  const currentDate = format(new Date(), "yyyy-MM-dd", {
    in: tz(user.timeZone),
  });

  const todayPlan = await db.query.DailyPlanTable.findFirst({
    where: and(
      eq(DailyPlanTable.userId, userId),
      eq(DailyPlanTable.planDate, currentDate),
    ),
    with: {
      items: {
        orderBy: (items, { asc }) => [asc(items.position)],
        with: {
          task: true,
        },
      },
    },
  });

  return todayPlan ?? null;
};

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

  const taskCount = sql<number>`count(*) over()`.mapWith(Number);
  const [todayTasks, tasksNeedAttention, unsortedTasks] = await Promise.all([
    db
      .select({ ...getTableColumns(TaskTable), totalCount: taskCount })
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
          inArray(TaskTable.status, ["in_progress", "not_started"]),
        ),
      )
      .orderBy(asc(TaskTable.id))
      .limit(1),
    db
      .select({ ...getTableColumns(TaskTable), totalCount: taskCount })
      .from(TaskTable)
      .where(
        and(
          eq(TaskTable.userId, userId),
          or(
            lte(TaskTable.scheduledAt, startUtc),
            lte(TaskTable.dueAt, startUtc),
          ),
          inArray(TaskTable.status, ["in_progress", "not_started"]),
        ),
      )
      .orderBy(asc(taskPriorityRank(TaskTable.priority)), asc(TaskTable.id))
      .limit(1),
    db
      .select({ ...getTableColumns(TaskTable), totalCount: taskCount })
      .from(TaskTable)
      .where(
        and(
          isNull(TaskTable.scheduledAt),
          isNull(TaskTable.dueAt),
          isNull(TaskTable.projectId),
          isNull(TaskTable.milestoneId),
          lte(TaskTable.createdAt, threeDaysAgo),
          eq(TaskTable.userId, userId),
          inArray(TaskTable.status, ["in_progress", "not_started"]),
        ),
      )
      .orderBy(asc(taskPriorityRank(TaskTable.priority)), asc(TaskTable.id))
      .limit(1),
  ]);

  const todayTaskCount = todayTasks[0]?.totalCount ?? 0;
  const tasksNeedAttentionCount = tasksNeedAttention[0]?.totalCount ?? 0;
  const unsortedTaskCount = unsortedTasks[0]?.totalCount ?? 0;

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
        inArray(TaskTable.status, ["not_started", "in_progress"]),
      ),
    )
    .orderBy(
      asc(taskPriorityRank(TaskTable.priority)),
      asc(TaskTable.createdAt),
      asc(TaskTable.id),
    )
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

    const outputWithExtras = (
      await Promise.all(
        output.map(async (suggestion) => {
          const [project, milestone] = await Promise.all([
            suggestion.suggestedProjectId
              ? confirmUserProjectOwnership(suggestion.suggestedProjectId)
              : Promise.resolve(null),
            suggestion.suggestedMilestoneId
              ? confirmUserMilestoneOwnership(suggestion.suggestedMilestoneId)
              : Promise.resolve(null),
          ]);

          const task = triageCandidates.find(
            (candidate) => candidate.id === suggestion.taskId,
          );

          return {
            ...suggestion,
            task,
            project,
            milestone,
          };
        }),
      )
    ).filter((suggestion): suggestion is TriageSuggestion =>
      Boolean(suggestion.task),
    );
    if (outputWithExtras.length !== output.length)
      throw new Error(GENERAL_ERROR_MESSAGE);

    const outputTaskIds = new Set(
      outputWithExtras.map((suggestion) => suggestion.taskId),
    );

    const hasEveryCandidate =
      outputWithExtras.length === triageCandidates.length &&
      outputTaskIds.size === triageCandidates.length &&
      triageCandidates.every((task) => outputTaskIds.has(task.id));
    if (!hasEveryCandidate)
      throw new Error("The AI did not return one suggestion for every task.");

    return {
      error: false,
      message: "Triage suggestions generated successfully!",
      output: outputWithExtras,
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

export const processTriageAnswerAction = async ({
  taskId,
  answer: unsafeAnswer,
  suggestion,
}: {
  taskId: string;
  answer: SuggestionAnswerSchemaType;
  suggestion: TriageSuggestion;
}) => {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return {
      error: true,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data: answer, success } =
    suggestionAnswerSchema.safeParse(unsafeAnswer);
  if (!success) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const parsedSuggestion = triageSuggestionSchema.safeParse(suggestion);
  if (!parsedSuggestion.success || parsedSuggestion.data.taskId !== taskId) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const existingTask = await confirmUserTaskOwnership(taskId);
  if (!existingTask) {
    return {
      error: true,
      message: NOT_FOUND_ERROR_MESSAGE,
    };
  }

  const validatedSuggestion = parsedSuggestion.data;
  const [suggestedProject, suggestedMilestone] = await Promise.all([
    validatedSuggestion.suggestedProjectId
      ? confirmUserProjectOwnership(validatedSuggestion.suggestedProjectId)
      : Promise.resolve(null),
    validatedSuggestion.suggestedMilestoneId
      ? confirmUserMilestoneOwnership(validatedSuggestion.suggestedMilestoneId)
      : Promise.resolve(null),
  ]);
  if (
    (validatedSuggestion.suggestedProjectId && !suggestedProject) ||
    (validatedSuggestion.suggestedMilestoneId && !suggestedMilestone)
  ) {
    return {
      error: true,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  let taskData: Partial<TaskSelectType> = {};

  try {
    switch (answer) {
      case "accept": {
        taskData = {
          name: validatedSuggestion.suggestedName ?? undefined,
          projectId: validatedSuggestion.suggestedProjectId ?? undefined,
          milestoneId: validatedSuggestion.suggestedMilestoneId ?? undefined,
          status: validatedSuggestion.suggestedStatus ?? undefined,
          priority: validatedSuggestion.suggestedPriority ?? undefined,
          scheduledAt: validatedSuggestion.suggestedScheduledAt
            ? parseISO(validatedSuggestion.suggestedScheduledAt)
            : undefined,
          dueAt: validatedSuggestion.suggestedDueAt
            ? parseISO(validatedSuggestion.suggestedDueAt)
            : undefined,
        };
        break;
      }
      case "someday": {
        taskData = {
          status: "backlog",
          scheduledAt: null,
        };
        break;
      }
      default: {
        throw new Error(`Unknown answer: ${answer satisfies never}`);
      }
    }

    const definedTaskData = Object.fromEntries(
      Object.entries(taskData).filter(([, value]) => value !== undefined),
    ) as Partial<TaskSelectType>;

    const parsedUpdate = updateTaskSchema.safeParse(definedTaskData);
    if (!parsedUpdate.success) throw new Error(INVALID_DATA_ERROR_MESSAGE);

    const completeTask = taskSchema.safeParse({
      name: existingTask.name,
      description: existingTask.description,
      emoji: existingTask.emoji,
      priority: existingTask.priority,
      status: existingTask.status,
      projectId: existingTask.projectId,
      milestoneId: existingTask.milestoneId,
      scheduledAt: existingTask.scheduledAt,
      dueAt: existingTask.dueAt,
      ...parsedUpdate.data,
    });
    if (!completeTask.success) throw new Error(INVALID_DATA_ERROR_MESSAGE);

    const updatedTask = await updateTaskDb(taskId, parsedUpdate.data);
    if (!updatedTask) throw new Error("Failed to update task.");

    return {
      error: false,
      message: "Triage answer processed successfully!",
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

const getPlanDateInformation = (
  timeZone: string,
  currentDateTime = new Date(),
) => {
  const planDate = format(currentDateTime, "yyyy-MM-dd", {
    in: tz(timeZone),
  });

  const localDate = parse(planDate, "yyyy-MM-dd", TZDate.tz(timeZone), {
    in: tz(timeZone),
  });

  const { startUtc, endUtc } = getLocalDayBounds(localDate, timeZone);

  return {
    planDate,
    startUtc,
    endUtc,
  };
};
const readDailyPlanCandidates = async ({
  userId,
  startUtc,
  endUtc,
}: {
  userId: string;
  startUtc: Date;
  endUtc: Date;
}) => {
  const relevanceRank = sql<number>`
    CASE
      WHEN ${TaskTable.dueAt} < ${startUtc} THEN 1
      WHEN ${TaskTable.scheduledAt} < ${startUtc} THEN 2
      WHEN ${TaskTable.dueAt} <= ${endUtc} THEN 3
      WHEN ${TaskTable.scheduledAt} <= ${endUtc} THEN 4
      WHEN ${TaskTable.status} = 'in_progress' THEN 5
      ELSE 6
    END
  `;

  return db
    .select()
    .from(TaskTable)
    .where(
      and(
        eq(TaskTable.userId, userId),
        inArray(TaskTable.status, ["not_started", "in_progress"]),
        or(
          lte(TaskTable.scheduledAt, endUtc),
          lte(TaskTable.dueAt, endUtc),
          and(isNull(TaskTable.scheduledAt), isNull(TaskTable.dueAt)),
        ),
      ),
    )
    .orderBy(
      relevanceRank,
      taskPriorityRank(TaskTable.priority),
      asc(TaskTable.dueAt),
      asc(TaskTable.scheduledAt),
      asc(TaskTable.createdAt),
      asc(TaskTable.id),
    )
    .limit(MAX_PLAN_CANDIDATES);
};
const createFallbackDailyPlan = ({
  candidates,
  availableMinutes,
  energyLevel,
  startUtc,
  endUtc,
}: {
  candidates: TaskSelectType[];
  availableMinutes: number;
  energyLevel: DailyPlanEnergyLevel;
  startUtc: Date;
  endUtc: Date;
}): GeneratedDailyPlanSchemaType => {
  const defaultEstimate = {
    low: 20,
    medium: 30,
    high: 45,
  }[energyLevel];

  let remainingMinutes = availableMinutes;

  const items: GeneratedDailyPlanSchemaType["items"] = [];

  for (const task of candidates) {
    if (remainingMinutes < 10 || items.length >= MAX_PLAN_ITEMS) {
      break;
    }

    const estimatedMinutes = Math.min(defaultEstimate, remainingMinutes);

    const reason =
      task.status === "in_progress"
        ? "Continue work that is already in progress."
        : task.dueAt && task.dueAt < startUtc
          ? "Prioritized because this task is overdue."
          : task.scheduledAt && task.scheduledAt < startUtc
            ? "Prioritized because this scheduled task needs attention."
            : task.dueAt && task.dueAt <= endUtc
              ? "Included because this task is due today."
              : task.scheduledAt && task.scheduledAt <= endUtc
                ? "Included because this task is scheduled for today."
                : "Included based on its priority and age.";

    items.push({
      taskId: task.id,
      estimatedMinutes,
      reason,
    });

    remainingMinutes -= estimatedMinutes;
  }

  const energyDescription = {
    low: "a lighter workload with shorter focus blocks",
    medium: "a balanced and achievable workload",
    high: "a focused workload that uses your available energy",
  }[energyLevel];

  return {
    summary:
      items.length > 0
        ? `Your plan uses ${energyDescription} and prioritizes the work that needs attention first.`
        : "There are no eligible active tasks to include in today's plan.",
    items,
  };
};
const normalizeGeneratedPlan = ({
  plan,
  candidates,
  availableMinutes,
}: {
  plan: GeneratedDailyPlanSchemaType;
  candidates: TaskSelectType[];
  availableMinutes: number;
}): GeneratedDailyPlanSchemaType | null => {
  const candidateIds = new Set(candidates.map((candidate) => candidate.id));

  const seenTaskIds = new Set<string>();
  const items: GeneratedDailyPlanSchemaType["items"] = [];

  let remainingMinutes = availableMinutes;

  for (const item of plan.items) {
    if (items.length >= MAX_PLAN_ITEMS || remainingMinutes < 10) {
      break;
    }

    if (!candidateIds.has(item.taskId) || seenTaskIds.has(item.taskId)) {
      continue;
    }

    const estimatedMinutes = Math.min(item.estimatedMinutes, remainingMinutes);

    items.push({
      ...item,
      estimatedMinutes,
    });

    seenTaskIds.add(item.taskId);
    remainingMinutes -= estimatedMinutes;
  }

  if (candidates.length > 0 && items.length === 0) {
    return null;
  }

  return {
    summary: plan.summary,
    items,
  };
};

export const generateDailyPlanAction = async (
  unsafeData: PlanMyDaySchemaType,
) => {
  const { userId, user } = await getCurrentUser();

  if (!userId || !user) {
    return {
      error: true as const,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const parsedInput = planMyDaySchema.safeParse(unsafeData);

  if (!parsedInput.success) {
    return {
      error: true as const,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  const { timeAvailable, energyLevel } = parsedInput.data;

  try {
    const now = new Date();

    const { planDate, startUtc, endUtc } = getPlanDateInformation(
      user.timeZone,
      now,
    );

    const candidates = await readDailyPlanCandidates({
      userId,
      startUtc,
      endUtc,
    });

    const fallbackPlan = () =>
      createFallbackDailyPlan({
        candidates,
        availableMinutes: timeAvailable,
        energyLevel,
        startUtc,
        endUtc,
      });

    let generatedPlan: GeneratedDailyPlanSchemaType;
    let usedFallback = false;

    if (candidates.length === 0) {
      generatedPlan = fallbackPlan();
      usedFallback = true;
    } else {
      try {
        const { output } = await generateText({
          model: openrouter("z-ai/glm-5.3-flash"),
          output: Output.object({
            schema: generatedDailyPlanSchema,
          }),
          instructions: GENERATE_DAILY_PLAN_INSTRUCTIONS,
          prompt: GENERATE_DAILY_PLAN_PROMPT({
            planDate,
            timeZone: user.timeZone,
            availableMinutes: timeAvailable,
            energyLevel,
            tasks: candidates,
            currentDateTime: now,
          }),
        });

        const normalizedPlan = normalizeGeneratedPlan({
          plan: output,
          candidates,
          availableMinutes: timeAvailable,
        });

        if (normalizedPlan) {
          generatedPlan = normalizedPlan;
        } else {
          generatedPlan = fallbackPlan();
          usedFallback = true;
        }
      } catch (error) {
        console.error("Daily-plan AI generation failed:", error);

        generatedPlan = fallbackPlan();
        usedFallback = true;
      }
    }

    const taskById = new Map(candidates.map((task) => [task.id, task]));

    const enrichedItems = generatedPlan.items.map((item) => {
      const task = taskById.get(item.taskId);
      if (!task) throw new Error("Generated plan referenced unknown task.");

      return {
        ...item,
        task,
      };
    });

    const draft = {
      planDate,
      availableMinutes: timeAvailable,
      energyLevel,
      summary: generatedPlan.summary,
      items: enrichedItems,
    };

    return {
      error: false as const,
      message: "Your daily plan is ready!",
      draft,
      usedFallback,
    };
  } catch (error) {
    console.error("Failed to generate daily plan:", error);

    return {
      error: true as const,
      message: isError(error) ? error.message : GENERAL_ERROR_MESSAGE,
    };
  }
};
export const acceptDailyPlanAction = async (
  unsafeDraft: DailyPlanDraftSchemaType,
) => {
  const { userId, user } = await getCurrentUser();
  if (!userId || !user) {
    return {
      error: true as const,
      message: UNAUTHED_ERROR_MESSAGE,
    };
  }

  const { data: draft, success } = dailyPlanDraftSchema.safeParse(unsafeDraft);
  if (!success) {
    return {
      error: true as const,
      message: INVALID_DATA_ERROR_MESSAGE,
    };
  }

  try {
    const { planDate: currentPlanDate } = getPlanDateInformation(user.timeZone);

    if (draft.planDate !== currentPlanDate) {
      return {
        error: true as const,
        message:
          "This plan was generated for a different day. Please generate a new plan.",
      };
    }

    const taskIds = draft.items.map((item) => item.taskId);
    const uniqueTaskIds = new Set(taskIds);

    if (uniqueTaskIds.size !== taskIds.length) {
      return {
        error: true as const,
        message: "This plan contains duplicate tasks.",
      };
    }

    const totalEstimatedMinutes = draft.items.reduce(
      (total, item) => total + item.estimatedMinutes,
      0,
    );

    if (totalEstimatedMinutes > draft.availableMinutes) {
      return {
        error: true as const,
        message: "The plan requires more time than is available.",
      };
    }

    const existingTasks =
      taskIds.length > 0
        ? await db
            .select()
            .from(TaskTable)
            .where(
              and(eq(TaskTable.userId, userId), inArray(TaskTable.id, taskIds)),
            )
        : [];
    if (existingTasks.length !== uniqueTaskIds.size) {
      return {
        error: true as const,
        message: "One or more tasks in this plan are no longer available.",
      };
    }

    const taskById = new Map(existingTasks.map((task) => [task.id, task]));
    const savedPlan = await db.transaction(async (tx) => {
      const [dailyPlan] = await tx
        .insert(DailyPlanTable)
        .values({
          userId,
          planDate: draft.planDate,
          availableMinutes: draft.availableMinutes,
          energyLevel: draft.energyLevel,
          summary: draft.summary,
        })
        .onConflictDoUpdate({
          target: [DailyPlanTable.userId, DailyPlanTable.planDate],
          set: {
            availableMinutes: draft.availableMinutes,
            energyLevel: draft.energyLevel,
            summary: draft.summary,
          },
        })
        .returning();
      if (!dailyPlan) throw new Error("Failed to save the daily plan.");

      await tx
        .delete(DailyPlanItemTable)
        .where(eq(DailyPlanItemTable.dailyPlanId, dailyPlan.id));

      const planItems =
        draft.items.length > 0
          ? await tx
              .insert(DailyPlanItemTable)
              .values(
                draft.items.map((item, position) => ({
                  dailyPlanId: dailyPlan.id,
                  taskId: item.taskId,
                  position,
                  estimatedMinutes: item.estimatedMinutes,
                  reason: item.reason,
                })),
              )
              .returning()
          : [];

      return {
        ...dailyPlan,
        items: planItems.map((item) => ({
          ...item,
          task: taskById.get(item.taskId)!,
        })),
      };
    });

    return {
      error: false as const,
      message: "Your daily plan was saved successfully!",
      plan: savedPlan,
    };
  } catch (error) {
    console.error(error);
    return {
      error: true as const,
      message: isError(error) ? error.message : GENERAL_ERROR_MESSAGE,
    };
  }
};
