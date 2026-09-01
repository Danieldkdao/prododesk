"use client";

import { ErrorState } from "@/components/error-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { generateTriageSuggestionsAction } from "@/features/plan-my-day/actions/actions";
import { useConfirm } from "@/hooks/use-confirm";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { ReactElement, ReactNode, useState } from "react";
import { toast } from "sonner";
import { PlannerCardOutcome } from "../lib/types";
import { TriageTasksDialogContent } from "./triage-tasks-dialog-content";
import { Button } from "@/components/ui/button";

const TriageTasksLoading = () => {
  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Loading your tasks</DialogTitle>
      </DialogHeader>
      <div className="p-3 @xl:p-5 flex flex-col items-center gap-4">
        <Loader2Icon className="text-primary size-12 animate-spin" />
        <div className="flex flex-col gap-0.5 items-center max-w-150 w-full">
          <span className="text-center text-2xl @xl:text-3xl font-semibold">
            Scaffolding your tasks...
          </span>
          <p className="text-muted-foreground text-center text-lg">
            We are gathering your tasks and creating suggestions for you. This
            may take a few moments.
          </p>
        </div>
      </div>
    </>
  );
};

const TriageTasksError = () => {
  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Something went wrong</DialogTitle>
      </DialogHeader>
      <ErrorState
        title="Something went wrong"
        description="We were unable to load your tasks. Try refreshing the page or come back later."
      />
    </>
  );
};

const TriageTasksEndingState = ({
  endingState,
  closeDialog,
  handleRestart,
}: {
  endingState: PlannerCardOutcome;
  closeDialog: () => void;
  handleRestart: () => void;
}) => {
  const needsMoreTriage = endingState.state === "triage";

  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Triage complete</DialogTitle>
      </DialogHeader>
      <div className="p-3 @xl:p-5 flex flex-col items-center gap-4">
        <CheckCircle2Icon className="text-emerald-600 size-12" />
        <div className="flex flex-col gap-0.5 items-center max-w-150 w-full">
          <span className="text-center text-2xl @xl:text-3xl font-semibold">
            {needsMoreTriage ? "A few tasks still need sorting" : "Triage complete"}
          </span>
          <p className="text-muted-foreground text-center text-lg">
            {needsMoreTriage
              ? "Continue with the remaining tasks, or return to the dashboard for now."
              : "Your dashboard has been updated with the next best action."}
          </p>
        </div>
        <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4">
          <Button variant="outline" size="lg" onClick={closeDialog}>
            Close
          </Button>
          <Button
            size="lg"
            onClick={needsMoreTriage ? handleRestart : closeDialog}
          >
            {needsMoreTriage ? "Continue triage" : "Done"}
          </Button>
        </div>
      </div>
    </>
  );
};

export const TriageTasksDialog = ({ children }: { children: ReactElement }) => {
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Leave",
    "Are you sure you want to leave?",
  );
  const [triageDialogOpen, setTriageDialogOpen] = useState(false);
  const [endingState, setEndingState] = useState<PlannerCardOutcome | null>(
    null,
  );

  const {
    isPending,
    error,
    data,
    mutate: generateSuggestionsMutation,
    reset: resetSuggestions,
  } = useMutation({
    mutationFn: async () => {
      const result = await generateTriageSuggestionsAction();

      if (result.error) throw new Error(result.message);

      return result.output;
    },
    onError: (error) => {
      console.error(error);
      toast.error("We were unable to generate your suggestions.");
    },
  });

  const resetState = () => {
    setEndingState(null);
    resetSuggestions();
  };

  const restartTriage = () => {
    resetState();
    generateSuggestionsMutation();
  };

  const triageSuggestions = data ?? [];

  // const triageSuggestions = [
  //   {
  //     taskId: "13d45717-ecbb-4c9d-a7fd-2ece99dbc183",
  //     suggestedName: "Bake a dessert from scratch",
  //     suggestedProjectId: "b0439721-c3af-4462-8498-7b5384268bbc",
  //     suggestedMilestoneId: null,
  //     suggestedScheduledAt: null,
  //     suggestedDueAt: null,
  //     suggestedStatus: null,
  //     confidence: "high" as const,
  //     reason:
  //       "Clear semantic match to the Cooking Adventures project, whose outcome explicitly includes cooking more meals from scratch. No deadline is implied, so no due date is suggested, and scheduling was left open pending the milestone lookup.",
  //     clarification: null,
  //     project: {
  //       id: "b0439721-c3af-4462-8498-7b5384268bbc",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Cooking Adventures",
  //       outcome:
  //         "Become a more confident home cook by mastering new techniques, expanding my recipe repertoire, and cooking more meals from scratch.",
  //       icon: "🍳",
  //       color: "orange" as const,
  //       areaId: null,
  //       startAt: null,
  //       endAt: null,
  //       status: "active" as const,
  //       isArchived: false,
  //       archivedAt: null,
  //       createdAt: new Date("2026-08-30T18:30:48.444518Z"),
  //       updatedAt: new Date("2026-08-30T18:30:48.444518Z"),
  //     },
  //     milestone: null,
  //     task: {
  //       id: "13d45717-ecbb-4c9d-a7fd-2ece99dbc183",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Bake a dessert from scratch",
  //       description:
  //         "Bake a dessert entirely from scratch — cookies, brownies, or a fruit tart — no box mixes allowed.",
  //       emoji: "🍰",
  //       status: "not_started" as const,
  //       priority: "medium" as const,
  //       scheduledAt: null,
  //       dueAt: null,
  //       projectId: null,
  //       milestoneId: null,
  //       createdAt: new Date("2026-08-27T05:00:00.000Z"),
  //       updatedAt: new Date("2026-08-30T18:43:50.344Z"),
  //     },
  //   },
  //   {
  //     taskId: "38d0badb-eb0b-4b79-ae92-c45ab873ac4c",
  //     suggestedName: "Solve one algorithm coding kata",
  //     suggestedProjectId: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //     suggestedMilestoneId: null,
  //     suggestedScheduledAt: null,
  //     suggestedDueAt: null,
  //     suggestedStatus: null,
  //     confidence: "high" as const,
  //     reason:
  //       "Algorithm katas are self-directed technical learning, which aligns directly with the Software Engineering Improvement outcome (consistent technical learning). No real deadline is implied, so no due date is suggested.",
  //     clarification: null,
  //     project: {
  //       id: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Software Engineering Improvement",
  //       outcome:
  //         "Level up engineering skills: cleaner code, better testing habits, stronger system design, and consistent technical learning.",
  //       icon: "⚙️",
  //       color: "green" as const,
  //       areaId: null,
  //       startAt: null,
  //       endAt: null,
  //       status: "active" as const,
  //       isArchived: false,
  //       archivedAt: null,
  //       createdAt: new Date("2026-08-30T18:30:48.297631Z"),
  //       updatedAt: new Date("2026-08-30T18:30:48.297631Z"),
  //     },
  //     milestone: null,
  //     task: {
  //       id: "38d0badb-eb0b-4b79-ae92-c45ab873ac4c",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Solve one algorithm coding kata",
  //       description:
  //         "Pick a problem you've never solved (e.g., a graph or dynamic programming challenge) and work through it from scratch. Focus on the approach before coding.",
  //       emoji: "🧩",
  //       status: "not_started" as const,
  //       priority: "medium" as const,
  //       scheduledAt: null,
  //       dueAt: null,
  //       projectId: null,
  //       milestoneId: null,
  //       createdAt: new Date("2026-08-27T05:00:00.000Z"),
  //       updatedAt: new Date("2026-08-30T18:43:50.344Z"),
  //     },
  //   },
  //   {
  //     taskId: "394a6282-5121-47da-986c-25d4e1a40473",
  //     suggestedName: "Fix a bug from the backlog",
  //     suggestedProjectId: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //     suggestedMilestoneId: null,
  //     suggestedScheduledAt: null,
  //     suggestedDueAt: null,
  //     suggestedStatus: null,
  //     confidence: "high" as const,
  //     reason:
  //       "Bug fixing toward cleaner code is a core part of the Software Engineering Improvement outcome. No specific bug or deadline is named, so no due date is suggested.",
  //     clarification: null,
  //     project: {
  //       id: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Software Engineering Improvement",
  //       outcome:
  //         "Level up engineering skills: cleaner code, better testing habits, stronger system design, and consistent technical learning.",
  //       icon: "⚙️",
  //       color: "green" as const,
  //       areaId: null,
  //       startAt: null,
  //       endAt: null,
  //       status: "active" as const,
  //       isArchived: false,
  //       archivedAt: null,
  //       createdAt: new Date("2026-08-30T18:30:48.297631Z"),
  //       updatedAt: new Date("2026-08-30T18:30:48.297631Z"),
  //     },
  //     milestone: null,
  //     task: {
  //       id: "394a6282-5121-47da-986c-25d4e1a40473",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Fix a bug from the backlog",
  //       description:
  //         "Grab the oldest or most annoying bug from your backlog, reproduce it, root-cause it, and ship the fix.",
  //       emoji: "🐛",
  //       status: "not_started" as const,
  //       priority: "medium" as const,
  //       scheduledAt: null,
  //       dueAt: null,
  //       projectId: null,
  //       milestoneId: null,
  //       createdAt: new Date("2026-08-27T05:00:00.000Z"),
  //       updatedAt: new Date("2026-08-30T18:43:50.344Z"),
  //     },
  //   },
  //   {
  //     taskId: "47319e7a-2d95-4e0c-840a-293ed9121a5c",
  //     suggestedName: "Refactor a messy function into pure functions",
  //     suggestedProjectId: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //     suggestedMilestoneId: null,
  //     suggestedScheduledAt: null,
  //     suggestedDueAt: null,
  //     suggestedStatus: null,
  //     confidence: "high" as const,
  //     reason:
  //       "Refactoring for small, testable functions maps directly to the Software Engineering Improvement outcome (cleaner code, better testing habits). No due date is implied.",
  //     clarification: null,
  //     project: {
  //       id: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Software Engineering Improvement",
  //       outcome:
  //         "Level up engineering skills: cleaner code, better testing habits, stronger system design, and consistent technical learning.",
  //       icon: "⚙️",
  //       color: "green" as const,
  //       areaId: null,
  //       startAt: null,
  //       endAt: null,
  //       status: "active" as const,
  //       isArchived: false,
  //       archivedAt: null,
  //       createdAt: new Date("2026-08-30T18:30:48.297631Z"),
  //       updatedAt: new Date("2026-08-30T18:30:48.297631Z"),
  //     },
  //     milestone: null,
  //     task: {
  //       id: "47319e7a-2d95-4e0c-840a-293ed9121a5c",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Refactor a messy function into pure functions",
  //       description:
  //         "Pick a long, tangled function in your codebase and break it into small, testable pure functions. Add unit tests to lock in the behavior.",
  //       emoji: "🧹",
  //       status: "not_started" as const,
  //       priority: "medium" as const,
  //       scheduledAt: null,
  //       dueAt: null,
  //       projectId: null,
  //       milestoneId: null,
  //       createdAt: new Date("2026-08-27T05:00:00.000Z"),
  //       updatedAt: new Date("2026-08-30T18:43:50.344Z"),
  //     },
  //   },
  //   {
  //     taskId: "53a39b3a-6792-4a4d-a39a-20b3ed82cad6",
  //     suggestedName: "Write unit tests for an untested module",
  //     suggestedProjectId: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //     suggestedMilestoneId: null,
  //     suggestedScheduledAt: null,
  //     suggestedDueAt: null,
  //     suggestedStatus: null,
  //     confidence: "high" as const,
  //     reason:
  //       "Writing tests for untested code is a direct expression of the Software Engineering Improvement outcome (better testing habits). No real deadline is implied, so no due date is suggested.",
  //     clarification: null,
  //     project: {
  //       id: "16a8af47-0877-4edf-a05e-076abc5c859c",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Software Engineering Improvement",
  //       outcome:
  //         "Level up engineering skills: cleaner code, better testing habits, stronger system design, and consistent technical learning.",
  //       icon: "⚙️",
  //       color: "green" as const,
  //       areaId: null,
  //       startAt: null,
  //       endAt: null,
  //       status: "active" as const,
  //       isArchived: false,
  //       archivedAt: null,
  //       createdAt: new Date("2026-08-30T18:30:48.297631Z"),
  //       updatedAt: new Date("2026-08-30T18:30:48.297631Z"),
  //     },
  //     milestone: null,
  //     task: {
  //       id: "53a39b3a-6792-4a4d-a39a-20b3ed82cad6",
  //       userId: "SQTKBvsbZqrxYPfmGz40pMuunIu4Rvsz",
  //       name: "Write unit tests for an untested module",
  //       description:
  //         "Pick a module with no test coverage and write unit tests for its core paths, including edge cases.",
  //       emoji: "🧪",
  //       status: "not_started" as const,
  //       priority: "medium" as const,
  //       scheduledAt: null,
  //       dueAt: null,
  //       projectId: null,
  //       milestoneId: null,
  //       createdAt: new Date("2026-08-27T05:00:00.000Z"),
  //       updatedAt: new Date("2026-08-30T18:43:50.344Z"),
  //     },
  //   },
  // ];

  let mainContent: ReactNode | null = null;

  if (isPending) {
    mainContent = <TriageTasksLoading />;
  } else if (!data || error) {
    mainContent = <TriageTasksError />;
  } else if (endingState) {
    mainContent = (
      <TriageTasksEndingState
        endingState={endingState}
        closeDialog={() => {
          resetState();
          setTriageDialogOpen(false);
        }}
        handleRestart={restartTriage}
      />
    );
  } else if (data) {
    mainContent = (
      <TriageTasksDialogContent
        triageSuggestions={triageSuggestions}
        onEnd={setEndingState}
      />
    );
  }

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
      if ((data && !endingState) || isPending) {
        const confirmation = await confirm();
        if (!confirmation) return;
      }

      setTriageDialogOpen(false);
    } else {
      setTriageDialogOpen(true);
      generateSuggestionsMutation();
    }
  };

  return (
    <>
      {ConfirmationDialog}
      <Dialog open={triageDialogOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger render={children} />
        <DialogContent
          className="min-w-0 sm:max-w-3xl @container"
          showCloseButton={false}
        >
          {mainContent}
        </DialogContent>
      </Dialog>
    </>
  );
};
