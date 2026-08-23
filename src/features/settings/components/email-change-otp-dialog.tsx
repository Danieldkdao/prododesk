import { OTPInput } from "@/components/otp-input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { authClient } from "@/lib/auth/auth-client";
import { SetterType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

export const EmailChangeOtpDialog = ({
  open,
  setOpen,
  email,
  afterEmailChange,
}: {
  open: boolean;
  setOpen: SetterType<boolean>;
  email: string;
  afterEmailChange?: () => void;
}) => {
  const router = useRouter();
  const [emailChangeOtp, setEmailChangeOtp] = useState("");
  const [isEmailChangePending, startEmailChangeTransition] = useTransition();
  const [isResendPending, startResendTransition] = useTransition();
  const [timeToNextResend, setTimeToNextResend] = useState(30);

  useEffect(() => {
    if (timeToNextResend <= 0 || !open) return;

    const interval = setInterval(() => {
      if (timeToNextResend <= 0 || !open) return;
      setTimeToNextResend((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeToNextResend, open]);

  const handleResendOtp = () => {
    if (timeToNextResend > 0 || isResendPending) return;

    startResendTransition(async () => {
      await authClient.emailOtp.requestEmailChange({
        newEmail: email,
        fetchOptions: {
          onSuccess: () => {
            toast.success("OTP resent successfully!");
            setTimeToNextResend(30);
          },
          onError: (error) => {
            toast.error(
              error.error.message || "Failed to resend OTP. Please try again.",
            );
          },
        },
      });
    });
  };

  const handleEmailChange = () => {
    startEmailChangeTransition(async () => {
      await authClient.emailOtp.changeEmail({
        newEmail: email,
        otp: emailChangeOtp,
        fetchOptions: {
          onError: () => {
            toast.error("Failed to change email. Please try again.");
          },
          onSuccess: () => {
            toast.success("Email changed successfully!");
            setOpen(false);
            setEmailChangeOtp("");
            router.refresh();
            afterEmailChange?.();
          },
        },
      });
    });
  };

  const buttonsDisabled = isEmailChangePending || isResendPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setTimeToNextResend(30);
        if (!value) {
          setEmailChangeOtp("");
        }
        setOpen(value);
      }}
    >
      <DialogContent>
        <DialogHeader className="sr-only">
          <DialogTitle>Enter OTP to Change Email</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-semibold text-center">Enter OTP</h2>
            <p className="text-muted-foreground text-center text-lg">
              We sent a confirmation OTP to the inbox of your new email. Enter
              it here to confirm the change.
            </p>
          </div>
          <OTPInput value={emailChangeOtp} onChange={setEmailChangeOtp} />
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-muted-foreground">
              Didn&apos;t receive a code?
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResendOtp}
              disabled={buttonsDisabled || timeToNextResend > 0}
            >
              <LoadingSwap isLoading={isResendPending}>
                {timeToNextResend > 0
                  ? `Resend (${timeToNextResend})`
                  : "Resend"}
              </LoadingSwap>
            </Button>
          </div>
          <Button
            className="w-full"
            disabled={buttonsDisabled || emailChangeOtp.length !== 6}
            onClick={handleEmailChange}
          >
            <LoadingSwap isLoading={isEmailChangePending}>
              Confirm Change
            </LoadingSwap>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
