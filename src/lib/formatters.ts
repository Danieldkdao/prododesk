import { Color } from "@/db/shared";
import { format, isSameDay, isToday } from "date-fns";
import { ArchiveIcon, CircleCheckIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { ArchiveStatusFilterOption } from "./params";

export const formatColor = (color: Color) => {
  switch (color) {
    case "amber":
      return {
        label: "Amber",
        bg: "bg-amber-500 dark:bg-amber-500",
        bgLight: "bg-amber-500/30 dark:bg-amber-500/30",
        text: "text-amber-500 dark:text-amber-500",
        hoverText: "hover:text-amber-500 dark:hover:text-amber-500",
        border: "border-amber-500 dark:border-amber-500",
        borderLeft: "border-l-amber-500 dark:border-l-amber-500",
        borderTop: "border-t-amber-500 dark:border-t-amber-500",
        dataActiveText:
          "data-active:text-amber-500 dark:data-active:text-amber-500",
        afterBg: "after:bg-amber-500 dark:after:bg-amber-500",
      };

    case "blue":
      return {
        label: "Blue",
        bg: "bg-blue-500 dark:bg-blue-500",
        bgLight: "bg-blue-500/30 dark:bg-blue-500/30",
        text: "text-blue-500 dark:text-blue-500",
        hoverText: "hover:text-blue-500 dark:hover:text-blue-500",
        border: "border-blue-500 dark:border-blue-500",
        borderLeft: "border-l-blue-500 dark:border-l-blue-500",
        borderTop: "border-t-blue-500 dark:border-t-blue-500",
        dataActiveText:
          "data-active:text-blue-500 dark:data-active:text-blue-500",
        afterBg: "after:bg-blue-500 dark:after:bg-blue-500",
      };

    case "cyan":
      return {
        label: "Cyan",
        bg: "bg-cyan-500 dark:bg-cyan-500",
        bgLight: "bg-cyan-500/30 dark:bg-cyan-500/30",
        text: "text-cyan-500 dark:text-cyan-500",
        hoverText: "hover:text-cyan-500 dark:hover:text-cyan-500",
        border: "border-cyan-500 dark:border-cyan-500",
        borderLeft: "border-l-cyan-500 dark:border-l-cyan-500",
        borderTop: "border-t-cyan-500 dark:border-t-cyan-500",
        dataActiveText:
          "data-active:text-cyan-500 dark:data-active:text-cyan-500",
        afterBg: "after:bg-cyan-500 dark:after:bg-cyan-500",
      };

    case "green":
      return {
        label: "Green",
        bg: "bg-green-500 dark:bg-green-500",
        bgLight: "bg-green-500/30 dark:bg-green-500/30",
        text: "text-green-500 dark:text-green-500",
        hoverText: "hover:text-green-500 dark:hover:text-green-500",
        border: "border-green-500 dark:border-green-500",
        borderLeft: "border-l-green-500 dark:border-l-green-500",
        borderTop: "border-t-green-500 dark:border-t-green-500",
        dataActiveText:
          "data-active:text-green-500 dark:data-active:text-green-500",
        afterBg: "after:bg-green-500 dark:after:bg-green-500",
      };

    case "orange":
      return {
        label: "Orange",
        bg: "bg-orange-500 dark:bg-orange-500",
        bgLight: "bg-orange-500/30 dark:bg-orange-500/30",
        text: "text-orange-500 dark:text-orange-500",
        hoverText: "hover:text-orange-500 dark:hover:text-orange-500",
        border: "border-orange-500 dark:border-orange-500",
        borderLeft: "border-l-orange-500 dark:border-l-orange-500",
        borderTop: "border-t-orange-500 dark:border-t-orange-500",
        dataActiveText:
          "data-active:text-orange-500 dark:data-active:text-orange-500",
        afterBg: "after:bg-orange-500 dark:after:bg-orange-500",
      };

    case "pink":
      return {
        label: "Pink",
        bg: "bg-pink-500 dark:bg-pink-500",
        bgLight: "bg-pink-500/30 dark:bg-pink-500/30",
        text: "text-pink-500 dark:text-pink-500",
        hoverText: "hover:text-pink-500 dark:hover:text-pink-500",
        border: "border-pink-500 dark:border-pink-500",
        borderLeft: "border-l-pink-500 dark:border-l-pink-500",
        borderTop: "border-t-pink-500 dark:border-t-pink-500",
        dataActiveText:
          "data-active:text-pink-500 dark:data-active:text-pink-500",
        afterBg: "after:bg-pink-500 dark:after:bg-pink-500",
      };

    case "purple":
      return {
        label: "Purple",
        bg: "bg-purple-500 dark:bg-purple-500",
        bgLight: "bg-purple-500/30 dark:bg-purple-500/30",
        text: "text-purple-500 dark:text-purple-500",
        hoverText: "hover:text-purple-500 dark:hover:text-purple-500",
        border: "border-purple-500 dark:border-purple-500",
        borderLeft: "border-l-purple-500 dark:border-l-purple-500",
        borderTop: "border-t-purple-500 dark:border-t-purple-500",
        dataActiveText:
          "data-active:text-purple-500 dark:data-active:text-purple-500",
        afterBg: "after:bg-purple-500 dark:after:bg-purple-500",
      };

    case "rose":
      return {
        label: "Rose",
        bg: "bg-rose-500 dark:bg-rose-500",
        bgLight: "bg-rose-500/30 dark:bg-rose-500/30",
        text: "text-rose-500 dark:text-rose-500",
        hoverText: "hover:text-rose-500 dark:hover:text-rose-500",
        border: "border-rose-500 dark:border-rose-500",
        borderLeft: "border-l-rose-500 dark:border-l-rose-500",
        borderTop: "border-t-rose-500 dark:border-t-rose-500",
        dataActiveText:
          "data-active:text-rose-500 dark:data-active:text-rose-500",
        afterBg: "after:bg-rose-500 dark:after:bg-rose-500",
      };

    case "slate":
      return {
        label: "Slate",
        bg: "bg-slate-500 dark:bg-slate-500",
        bgLight: "bg-slate-500/30 dark:bg-slate-500/30",
        text: "text-slate-500 dark:text-slate-500",
        hoverText: "hover:text-slate-500 dark:hover:text-slate-500",
        border: "border-slate-500 dark:border-slate-500",
        borderLeft: "border-l-slate-500 dark:border-l-slate-500",
        borderTop: "border-t-slate-500 dark:border-t-slate-500",
        dataActiveText:
          "data-active:text-slate-500 dark:data-active:text-slate-500",
        afterBg: "after:bg-slate-500 dark:after:bg-slate-500",
      };

    case "stone":
      return {
        label: "Stone",
        bg: "bg-stone-500 dark:bg-stone-500",
        bgLight: "bg-stone-500/30 dark:bg-stone-500/30",
        text: "text-stone-500 dark:text-stone-500",
        hoverText: "hover:text-stone-500 dark:hover:text-stone-500",
        border: "border-stone-500 dark:border-stone-500",
        borderLeft: "border-l-stone-500 dark:border-l-stone-500",
        borderTop: "border-t-stone-500 dark:border-t-stone-500",
        dataActiveText:
          "data-active:text-stone-500 dark:data-active:text-stone-500",
        afterBg: "after:bg-stone-500 dark:after:bg-stone-500",
      };

    default:
      throw new Error(`Unknown color: ${color satisfies never}`);
  }
};

export const formatCalendarValue = (
  value: Date | Date[] | DateRange | null | undefined,
  withTime?: boolean | undefined,
) => {
  if (!value) return "No dates selected";

  if (Array.isArray(value)) {
    return value.map((date) => format(date, "PP")).join(", ");
  }

  if (typeof value === "object" && "from" in value) {
    if (!value.from) return "No dates selected";

    return `${format(value.from, "PP")}${value.to ? `  -  ${format(value.to, "PP")}` : ""}`;
  }

  return withTime ? format(value, "PPpp") : format(value, "PP");
};

export const formatTaskDates = (
  scheduledAt: Date | null | undefined,
  dueAt: Date | null | undefined,
  includeDay = false,
) => {
  if (!scheduledAt && !dueAt) return "No dates";

  if (scheduledAt && dueAt) {
    return isSameDay(dueAt, scheduledAt)
      ? `${format(scheduledAt, "h:mm a")} - ${format(dueAt, "h:mm a")}`
      : `${format(scheduledAt, "PP")} - ${format(dueAt, "PP")}`;
  }

  if (scheduledAt) {
    return includeDay
      ? isToday(scheduledAt)
        ? `Today at ${format(scheduledAt, "h:mm a")}`
        : format(scheduledAt, "PP 'at' h:mm a")
      : format(scheduledAt, "h:mm a");
  }

  if (dueAt) {
    return `Due ${
      includeDay
        ? isToday(dueAt)
          ? `today at ${format(dueAt, "h:mm a")}`
          : format(dueAt, "PP 'at' h:mm a")
        : format(dueAt, "h:mm a")
    }`;
  }
};

export const formatArchivedStatus = (isArchived: boolean) => {
  if (isArchived) {
    return {
      text: "Archived",
      icon: ArchiveIcon,
    };
  }

  return {
    text: "Active",
    icon: CircleCheckIcon,
  };
};

export const formatArchiveStatusFilterOptions = (
  option: ArchiveStatusFilterOption,
) => {
  switch (option) {
    case "active":
      return "Active";
    case "all":
      return "All";
    case "archived":
      return "Archived";
    default:
      throw new Error(
        `Unknown archive status filter option: ${option satisfies never}`,
      );
  }
};
