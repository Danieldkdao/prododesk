import { ArchiveIcon, CheckCircleIcon } from "lucide-react";

export const formatAreaStatus = (isArchived: boolean) => {
  if (isArchived) {
    return {
      text: "Archived",
      icon: ArchiveIcon,
    };
  }

  return {
    text: "Active",
    icon: CheckCircleIcon,
  };
};
