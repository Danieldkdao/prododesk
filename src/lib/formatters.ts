import { Color } from "@/db/shared";

export const formatColor = (color: Color) => {
  switch (color) {
    case "amber":
      return {
        label: "Amber",
        bg: "bg-amber-500",
        text: "text-amber-500",
      };
    case "blue":
      return {
        label: "Blue",
        bg: "bg-blue-500",
        text: "text-blue-500",
      };
    case "cyan":
      return {
        label: "Cyan",
        bg: "bg-cyan-500",
        text: "text-cyan-500",
      };
    case "green":
      return {
        label: "Green",
        bg: "bg-green-500",
        text: "text-green-500",
      };
    case "orange":
      return {
        label: "Orange",
        bg: "bg-orange-500",
        text: "text-orange-500",
      };
    case "pink":
      return {
        label: "Pink",
        bg: "bg-pink-500",
        text: "text-pink-500",
      };
    case "purple":
      return {
        label: "Purple",
        bg: "bg-purple-500",
        text: "text-purple-500",
      };
    case "rose":
      return {
        label: "Rose",
        bg: "bg-rose-500",
        text: "text-rose-500",
      };
    case "slate":
      return {
        label: "Slate",
        bg: "bg-slate-500",
        text: "text-slate-500",
      };
    case "stone":
      return {
        label: "Stone",
        bg: "bg-stone-500",
        text: "text-stone-500",
      };
    default:
      throw new Error(`Unknown color: ${color satisfies never}`);
  }
};
