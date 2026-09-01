"use client";

import { Button } from "@/components/ui/button";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { cn, isError } from "@/lib/utils";
import { ListCheckIcon, SlidersHorizontalIcon } from "lucide-react";
import { SubmitEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  processTriageAnswerAction,
  readPlanMyDayDataAction,
} from "../actions/actions";
import { suggestionAnswerSchema } from "../actions/schemas";
import { formatSuggestionToQuestionnaireItem } from "../lib/formatters";
import { PlannerCardOutcome, TriageSuggestion } from "../lib/types";
import { TriageSuggestionEditor } from "./triage-suggestion-editor";

export const TriageTasksDialogContent = ({
  triageSuggestions,
  onEnd,
}: {
  triageSuggestions: TriageSuggestion[];
  onEnd: (state: PlannerCardOutcome) => void;
}) => {
  const formRef = useRef<HTMLFormElement>(null);
  const questionnaireItems = triageSuggestions.map(
    formatSuggestionToQuestionnaireItem,
  );
  const definitions = questionnaireItems.map((item) => item.definition);

  const [currentItemName, setCurrentItemName] = useState(definitions[0]?.name);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [isProcessPending, startProcessTransition] = useTransition();

  const currentItem = questionnaireItems.find(
    (item) => item.definition.name === currentItemName,
  );

  const processCurrentItem = async (): Promise<boolean> => {
    const form = formRef.current;

    if (!form || !currentItemName) return false;

    const currentItem = questionnaireItems.find(
      (item) => item.definition.name === currentItemName,
    );
    if (!currentItem) {
      toast.error("Unable to find the current task.");
      return false;
    }

    const formData = new FormData(form);
    const unsafeAnswer = formData.get(currentItemName);

    const { data: answer, success } = suggestionAnswerSchema.safeParse(
      String(unsafeAnswer),
    );
    if (!success) {
      toast.error("Invalid answer. Please select a valid option.");
      return false;
    }

    try {
      const response = await processTriageAnswerAction({
        taskId: currentItem.suggestion.taskId,
        answer,
        suggestion: currentItem.suggestion,
      });
      if (response.error) throw new Error(response.message);

      toast.success("Answer processed successfully!");
      return true;
    } catch (error) {
      const errorMessage = isError(error)
        ? error.message
        : "Unable to process this task.";
      console.error(error);
      toast.error(errorMessage);
      return false;
    }
  };

  const handleItemChange = async (nextItemName: string) => {
    startProcessTransition(async () => {
      const processed = await processCurrentItem();
      if (!processed) return;

      setCurrentItemName(nextItemName);
      setEditingTaskId(null);
    });
  };

  const finishTriage = async () => {
    const response = await readPlanMyDayDataAction();
    if (!response) {
      toast.error("Failed to finish triage. Please try again.");
      return false;
    }

    onEnd(
      response.state === "single"
        ? {
            state: response.state,
            source: response.source,
            taskId: response.singleTask.id,
          }
        : { state: response.state },
    );

    return true;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    startProcessTransition(async () => {
      const processed = await processCurrentItem();
      if (!processed) return;

      await finishTriage();
    });
  };

  const moveToNextSuggestion = () => {
    const currentIndex = questionnaireItems.findIndex(
      (item) => item.definition.name === currentItemName,
    );
    if (currentIndex === questionnaireItems.length - 1) {
      startProcessTransition(async () => {
        await finishTriage();
      });
      return;
    }
    if (currentIndex >= 0 && currentIndex < questionnaireItems.length - 1) {
      const nextItem = questionnaireItems[currentIndex + 1];
      if (nextItem) {
        setCurrentItemName(nextItem.definition.name);
        setEditingTaskId(null);
      }
    }
  };

  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Triage your tasks</DialogTitle>
      </DialogHeader>
      <Questionnaire
        ref={formRef}
        className="flex flex-col gap-4 min-w-0"
        items={definitions}
        item={currentItemName}
        onItemChange={handleItemChange}
        onSubmit={handleSubmit}
        shortcuts="letters"
      >
        <QuestionnaireProgress
          className="w-full"
          render={(props, state) => (
            <div {...props}>
              <div className="mb-2 flex gap-1.5" aria-hidden="true">
                {Array.from({ length: state.total }, (_, index) => (
                  <span
                    key={index}
                    className={
                      index < state.current
                        ? "h-1.5 flex-1 bg-primary"
                        : "h-1.5 flex-1 bg-muted"
                    }
                  />
                ))}
              </div>
            </div>
          )}
        />
        {questionnaireItems.map((item) => (
          <QuestionnaireItem
            key={item.definition.name}
            name={item.definition.name}
            required={item.definition.required}
            className="flex flex-col gap-4 min-w-0"
          >
            <div className="flex flex-col gap-2">
              <QuestionnaireTitle className="text-2xl font-semibold font-sans normal-case">
                {item.title}
              </QuestionnaireTitle>
              <QuestionnaireDescription className="text-muted-foreground text-lg">
                {item.description || "Yes"}
              </QuestionnaireDescription>
            </div>
            <div className="bg-accent/60 p-4 flex items-start gap-3 min-w-0 border-2 border-dashed">
              <div className="size-12 bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                {item.suggestion.task.emoji ? (
                  <span className="text-2xl">{item.suggestion.task.emoji}</span>
                ) : (
                  <ListCheckIcon className="size-8 text-primary" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-semibold">
                  {item.suggestion.task.name}
                </span>
                <p
                  className={cn(
                    "text-muted-foreground text-lg",
                    !item.suggestion.task.description && "italic",
                  )}
                >
                  {item.suggestion.task.description ||
                    "No description provided."}
                </p>
              </div>
            </div>
            {editingTaskId == item.suggestion.taskId ? (
              <TriageSuggestionEditor
                key={item.suggestion.taskId}
                triageSuggestion={item.suggestion}
                onDiscard={() => setEditingTaskId(null)}
                onSave={moveToNextSuggestion}
              />
            ) : (
              <QuestionnaireChoices>
                {item.choices.map((choice) => (
                  <QuestionnaireChoice key={choice.value} value={choice.value}>
                    <span className="text-lg font-semibold">
                      {choice.label}
                    </span>
                    {choice.description && (
                      <QuestionnaireChoiceDescription className="text-lg">
                        {choice.description}
                      </QuestionnaireChoiceDescription>
                    )}
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>
            )}
            <QuestionnaireError className="text-lg" />
          </QuestionnaireItem>
        ))}
        {editingTaskId === null && (
          <QuestionnaireActions>
            <div className="col-start-1 row-start-1">
              {currentItem && (
                <Button
                  variant={editingTaskId ? "ghost" : "outline"}
                  onClick={() =>
                    setEditingTaskId(currentItem.suggestion.taskId ?? null)
                  }
                  disabled={isProcessPending}
                >
                  <SlidersHorizontalIcon />
                  Edit
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              className="col-start-2 row-start-1 min-h-11 justify-self-end sm:min-h-0"
              disabled={isProcessPending}
              type="button"
              onClick={moveToNextSuggestion}
            >
              Decide later
            </Button>
            <QuestionnaireNext disabled={isProcessPending}>
              <LoadingSwap isLoading={isProcessPending}>Continue</LoadingSwap>
            </QuestionnaireNext>
            <QuestionnaireSubmit disabled={isProcessPending}>
              <LoadingSwap isLoading={isProcessPending}>
                Finish triage
              </LoadingSwap>
            </QuestionnaireSubmit>
          </QuestionnaireActions>
        )}
      </Questionnaire>
    </>
  );
};
