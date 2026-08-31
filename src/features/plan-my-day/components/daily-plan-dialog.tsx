"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useConfirm } from "@/hooks/use-confirm";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckIcon, RotateCcwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReactElement, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import {
  acceptDailyPlanAction,
  generateDailyPlanAction,
} from "../actions/actions";
import { planMyDaySchema, PlanMyDaySchemaType } from "../actions/schemas";
import { EnrichedDailyPlanDraft } from "../lib/types";
import { EnergyLevelInput } from "./energy-level-input";
import { PlanDraftDisplay } from "./plan-draft-display";
import { TimeAvailableInput } from "./time-available-input";

export const DailyPlanDialog = ({ children }: { children: ReactElement }) => {
  const router = useRouter();
  const [draft, setDraft] = useState<EnrichedDailyPlanDraft | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isRegeneratePending, startRegenerateTransition] = useTransition();
  const [isAcceptPending, startAcceptTransition] = useTransition();
  const [ConfirmationDialog, confirm] = useConfirm(
    "Confirm Leave",
    "Are you sure you want to leave? The generation will stop and you will lose your changes.",
  );
  const form = useForm<PlanMyDaySchemaType>({
    resolver: zodResolver(planMyDaySchema),
    defaultValues: {
      timeAvailable: 30,
      energyLevel: "low",
    },
  });

  const generatePlan = async (data: PlanMyDaySchemaType) => {
    const toastId = toast.loading("Generating your plan...");
    const response = await generateDailyPlanAction(data);
    if (response.error) {
      toast.error(response.message, { id: toastId });
    } else {
      toast.success(response.message, { id: toastId });
      console.log(response.draft);
      setDraft(response.draft);
    }
  };

  const handleSubmission = async (data: PlanMyDaySchemaType) => {
    await generatePlan(data);
  };

  const regeneratePlan = () => {
    const data = form.getValues();
    startRegenerateTransition(async () => {
      await generatePlan(data);
    });
  };

  const acceptPlan = () => {
    if (!draft) {
      toast.error("No plan draft found to accept.");
      return;
    }

    startAcceptTransition(async () => {
      const response = await acceptDailyPlanAction(draft);
      if (response.error) {
        toast.error(response.message);
      } else {
        toast.success(response.message);
        setDialogOpen(false);
        router.refresh();
      }
    });
  };

  const handleOpen = async (open: boolean) => {
    if (!open && form.formState.isSubmitting) {
      const confirmation = await confirm();
      if (!confirmation) return;
    }

    setDialogOpen(open);
  };

  const isPending = isRegeneratePending || isAcceptPending;

  return (
    <>
      {ConfirmationDialog}
      <Dialog open={dialogOpen} onOpenChange={handleOpen}>
        <DialogTrigger render={children} />
        <DialogContent
          className="min-w-0 sm:max-w-3xl @container"
          showCloseButton={false}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-2xl font-semibold">Plan my day</span>
            <p className="text-lg text-muted-foreground max-w-150">
              Let us turn your priorities, deadlines, and available time into a
              calm plan that you can actually finish.
            </p>
          </div>
          {draft ? (
            <div className="flex flex-col gap-4">
              <PlanDraftDisplay draft={draft} />
              <div className="flex items-center gap-4 justify-between">
                <Button
                  variant="outline"
                  onClick={() => handleOpen(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={regeneratePlan}
                  >
                    <LoadingSwap
                      isLoading={isRegeneratePending}
                      className="flex items-center gap-2"
                    >
                      <RotateCcwIcon />
                      Regenerate
                    </LoadingSwap>
                  </Button>
                  <Button disabled={isPending} onClick={acceptPlan}>
                    <LoadingSwap
                      isLoading={isAcceptPending}
                      className="flex items-center gap-2"
                    >
                      <CheckIcon />
                      Use this plan
                    </LoadingSwap>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <form
              onSubmit={form.handleSubmit(handleSubmission)}
              className="flex flex-col gap-4"
            >
              <Controller
                control={form.control}
                name="timeAvailable"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>How much time do you have today?</FieldLabel>
                    <FieldContent>
                      <TimeAvailableInput
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FieldContent>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="energyLevel"
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.error}>
                    <FieldLabel>What is your energy level today?</FieldLabel>
                    <FieldContent>
                      <EnergyLevelInput
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    </FieldContent>
                    {fieldState.error && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <div className="grid grid-cols-1 @2xl:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleOpen(false)}
                  disabled={form.formState.isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  <LoadingSwap isLoading={form.formState.isSubmitting}>
                    Generate Plan
                  </LoadingSwap>
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
