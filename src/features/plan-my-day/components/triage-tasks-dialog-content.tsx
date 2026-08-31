"use client";

import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/components/ui/questionnaire";
import { cn } from "@/lib/utils";
import { ListCheckIcon, SlidersHorizontalIcon } from "lucide-react";
import { formatSuggestionToQuestionnaireItem } from "../lib/formatters";
import { TriageSuggestion } from "../lib/types";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TriageSuggestionEditor } from "./triage-suggestion-editor";

export const TriageTasksDialogContent = ({
  triageSuggestions,
}: {
  triageSuggestions: TriageSuggestion[];
}) => {
  const questionnaireItems = triageSuggestions.map(
    formatSuggestionToQuestionnaireItem,
  );
  const definitions = questionnaireItems.map((item) => item.definition);

  const [currentItemName, setCurrentItemName] = useState(definitions[0]?.name);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const currentItem = questionnaireItems.find(
    (item) => item.definition.name === currentItemName,
  );

  return (
    <>
      <DialogHeader className="sr-only">
        <DialogTitle>Triage your tasks</DialogTitle>
      </DialogHeader>
      <Questionnaire
        className="flex flex-col gap-4 min-w-0"
        items={definitions}
        onItemChange={(itemName) => {
          setCurrentItemName(itemName);
          setEditingTaskId(null);
        }}
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
                {item.description}
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
              <TriageSuggestionEditor triageSuggestion={item.suggestion} />
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
        <QuestionnaireActions>
          <div className="col-start-1 row-start-1 flex items-center gap-2">
            <QuestionnairePrevious />
            {currentItem && (
              <Button
                variant={editingTaskId ? "ghost" : "outline"}
                onClick={() =>
                  setEditingTaskId((prev) =>
                    prev === null ? currentItem.suggestion.taskId : null,
                  )
                }
              >
                {editingTaskId ? (
                  "Discard edits"
                ) : (
                  <>
                    <SlidersHorizontalIcon />
                    Edit
                  </>
                )}
              </Button>
            )}
          </div>
          <QuestionnaireSkip variant="ghost" />
          <QuestionnaireNext>Continue</QuestionnaireNext>
          <QuestionnaireSubmit>Finish triage</QuestionnaireSubmit>
        </QuestionnaireActions>
      </Questionnaire>
    </>
  );
};
