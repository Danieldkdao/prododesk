import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { timeSchema } from "./schemas";
import z from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const mergeDateTime = (date: Date, time: string) => {
  if (
    !(date instanceof Date) ||
    isNaN(date.getTime()) ||
    !timeSchema.safeParse(time).success
  )
    return null;
  const [hours = 0, minutes = 0, seconds = 0] = time.split(":").map(Number);

  const selectedDate = new Date(date);
  selectedDate.setHours(hours, minutes, seconds, 0);

  return selectedDate;
};

export const areValidIds = (ids: string | string[]) => {
  const idSchema = z.uuid();
  if (typeof ids === "string") {
    return idSchema.safeParse(ids).success;
  } else {
    const results: boolean[] = [];
    for (const id of ids) {
      results.push(idSchema.safeParse(id).success);
    }

    return results.every(Boolean);
  }
};

export const formatMs = (ms: number) => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s`;
};
