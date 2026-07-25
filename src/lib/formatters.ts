import { Color } from "@/db/shared";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export const formatColor = (color: Color) => {
  switch (color) {
    case "amber":
      return {
        label: "Amber",
        bg: "bg-amber-500",
        bgLight: "bg-amber-500/30",
        text: "text-amber-500",
        border: "border-amber-500",
        borderLeft: "border-l-amber-500",
      };
    case "blue":
      return {
        label: "Blue",
        bg: "bg-blue-500",
        bgLight: "bg-blue-500/30",
        text: "text-blue-500",
        border: "border-blue-500",
        borderLeft: "border-l-blue-500",
      };
    case "cyan":
      return {
        label: "Cyan",
        bg: "bg-cyan-500",
        bgLight: "bg-cyan-500/30",
        text: "text-cyan-500",
        border: "border-cyan-500",
        borderLeft: "border-l-cyan-500",
      };
    case "green":
      return {
        label: "Green",
        bg: "bg-green-500",
        bgLight: "bg-green-500/30",
        text: "text-green-500",
        border: "border-green-500",
        borderLeft: "border-l-green-500",
      };
    case "orange":
      return {
        label: "Orange",
        bg: "bg-orange-500",
        bgLight: "bg-orange-500/30",
        text: "text-orange-500",
        border: "border-orange-500",
        borderLeft: "border-l-orange-500",
      };
    case "pink":
      return {
        label: "Pink",
        bg: "bg-pink-500",
        bgLight: "bg-pink-500/30",
        text: "text-pink-500",
        border: "border-pink-500",
        borderLeft: "border-l-pink-500",
      };
    case "purple":
      return {
        label: "Purple",
        bg: "bg-purple-500",
        bgLight: "bg-purple-500/30",
        text: "text-purple-500",
        border: "border-purple-500",
        borderLeft: "border-l-purple-500",
      };
    case "rose":
      return {
        label: "Rose",
        bg: "bg-rose-500",
        bgLight: "bg-rose-500/30",
        text: "text-rose-500",
        border: "border-rose-500",
        borderLeft: "border-l-rose-500",
      };
    case "slate":
      return {
        label: "Slate",
        bg: "bg-slate-500",
        bgLight: "bg-slate-500/30",
        text: "text-slate-500",
        border: "border-slate-500",
        borderLeft: "border-l-slate-500",
      };
    case "stone":
      return {
        label: "Stone",
        bg: "bg-stone-500",
        bgLight: "bg-stone-500/30",
        text: "text-stone-500",
        border: "border-stone-500",
        borderLeft: "border-l-stone-500",
      };
    default:
      throw new Error(`Unknown color: ${color satisfies never}`);
  }
};

export const formatCalendarValue = (
  value: Date | Date[] | DateRange | null | undefined,
) => {
  if (!value) return "No dates selected";

  if (Array.isArray(value)) {
    return value.map((date) => format(date, "PP")).join(", ");
  }

  if ("from" in value) {
    if (!value.from) return "No dates selected";

    return `${format(value.from, "PP")}${value.to ? `  -  ${format(value.to, "PP")}` : ""}`;
  }

  return format(value, "PP");
};
