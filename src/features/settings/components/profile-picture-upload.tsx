"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { UserAvatar } from "@/components/user-avatar";
import { completeProfileImageUpload } from "@/features/uploads/actions/actions";
import { UPLOAD_LIMITS } from "@/features/uploads/lib/constants";
import { useConfirm } from "@/hooks/use-confirm";
import { useProfileImageUpload } from "@/hooks/use-profile-image-upload";
import { authClient } from "@/lib/auth/auth-client";
import { generateFileUrl } from "@/lib/utils";
import { CheckIcon, EditIcon, RefreshCcwIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export const ProfilePictureUpload = ({
  name,
  image,
  profileImageKey,
}: {
  name: string;
  image?: string | null;
  profileImageKey?: string | null;
}) => {
  const router = useRouter();

  const [isImageChangePending, startImageChangeTransition] = useTransition();
  const [isImageResetPending, startImageResetTransition] = useTransition();

  const [confirmImageDialogOpen, setConfirmImageDialogOpen] = useState(false);
  const { inputRef, currentFile, reset, handleFileUpload, handleFilePreview } =
    useProfileImageUpload({
      accept: UPLOAD_LIMITS["profile-image"].accept,
      maxFileSizeBytes: UPLOAD_LIMITS["profile-image"].maxSize,
    });
  const [ResetConfirmationDialog, confirmReset] = useConfirm(
    "Confirm Reset",
    "Are you sure you want to reset your profile image? It will go back to the social provider default image or no image, whichever applies.",
  );

  const userProfileImage =
    currentFile?.previewUrl ??
    (profileImageKey ? generateFileUrl(profileImageKey) : image);

  const handleCancel = () => {
    reset();
    setConfirmImageDialogOpen(false);
  };

  const handleConfirmImageChange = () => {
    startImageChangeTransition(async () => {
      const uploadId = await handleFileUpload();

      if (!uploadId) {
        toast.error("Failed to upload image. Please try again.");
        return;
      }

      const response = await completeProfileImageUpload({ uploadId });
      if (response.error) {
        toast.error(response.message);
        return;
      }

      toast.success("Profile image updated successfully.");
      router.refresh();
      setConfirmImageDialogOpen(false);
      reset();
    });
  };

  const handleResetProfileImage = async () => {
    const confirmation = await confirmReset();
    if (!confirmation) return;

    const toastId = toast.loading("Resetting profile image...");

    startImageResetTransition(async () => {
      const response = await authClient.updateUser({
        profileImageKey: null,
      });
      if (response.error) {
        toast.error(
          response.error.message ||
            "Failed to reset profile image. Please try again.",
          {
            id: toastId,
          },
        );
        return;
      }
      toast.success("Profile image reset successfully.", { id: toastId });
      router.refresh();
    });
  };

  const isDropdownItemDisabled = isImageChangePending || isImageResetPending;

  return (
    <>
      {ResetConfirmationDialog}
      <Dialog
        open={confirmImageDialogOpen}
        onOpenChange={(open) => {
          if (isImageChangePending) return;
          if (!open) {
            handleCancel();
          }
          setConfirmImageDialogOpen(open);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="flex flex-col gap-4 items-center"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Confirm Image Change</DialogTitle>
          </DialogHeader>
          <UserAvatar
            name={name}
            image={userProfileImage}
            className="size-20"
            textClassName="text-2xl"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCancel}
              disabled={isImageChangePending}
            >
              <XIcon /> Cancel
            </Button>
            <Button
              className="w-full"
              disabled={isImageChangePending}
              onClick={handleConfirmImageChange}
            >
              <LoadingSwap
                className="flex items-center gap-2"
                isLoading={isImageChangePending}
              >
                <CheckIcon /> Confirm
              </LoadingSwap>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="relative w-fit">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                className="group relative rounded-full"
                aria-label="Edit profile picture"
              >
                <UserAvatar
                  name={name}
                  image={userProfileImage}
                  className="size-20"
                  textClassName="text-2xl"
                />
                <span className="absolute inset-0 z-10 flex cursor-pointer items-center justify-center rounded-full bg-black/20 text-white opacity-0 backdrop-blur-xs transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                  <EditIcon />
                </span>
              </button>
            }
          />
          <DropdownMenuContent align="start" side="bottom" className="w-auto">
            <DropdownMenuItem
              onClick={() => {
                inputRef.current?.click();
              }}
              disabled={isDropdownItemDisabled}
            >
              <EditIcon />
              Change Profile Picture
            </DropdownMenuItem>

            <DropdownMenuItem
              variant="destructive"
              disabled={isDropdownItemDisabled}
              onClick={handleResetProfileImage}
            >
              <RefreshCcwIcon />
              Reset Profile Picture
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            handleFilePreview(event);
            setConfirmImageDialogOpen(true);
          }}
        />
      </div>
    </>
  );
};
