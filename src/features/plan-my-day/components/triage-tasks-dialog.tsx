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
import { useRouter } from "next/navigation";

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
            {needsMoreTriage
              ? "A few tasks still need sorting"
              : "Triage complete"}
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
  const router = useRouter();
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
          router.refresh();
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
