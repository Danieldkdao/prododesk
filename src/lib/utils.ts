import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { timeSchema } from "./schemas";

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
