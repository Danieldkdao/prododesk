import { tz } from "@date-fns/tz";
import { clsx, type ClassValue } from "clsx";
import {
  format,
  endOfDay as getEndOfDay,
  endOfMonth as getEndOfMonth,
  endOfWeek as getEndOfWeek,
  startOfDay as getStartOfDay,
  startOfMonth as getStartOfMonth,
  startOfWeek as getStartOfWeek,
  transpose,
} from "date-fns";
import { twMerge } from "tailwind-merge";
import z from "zod";
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

export const getLocalDayBounds = (day: Date, timeZone: string) => {
  const startOfDay = getStartOfDay(day, {
    in: tz(timeZone),
  });
  const endOfDay = getEndOfDay(day, {
    in: tz(timeZone),
  });

  const startUtc = transpose(startOfDay, tz("UTC"));
  const endUtc = transpose(endOfDay, tz("UTC"));

  return {
    startUtc,
    endUtc,
  };
};

export const getLocalWeekBounds = (day: Date, timeZone: string) => {
  const startOfWeek = getStartOfWeek(day, {
    in: tz(timeZone),
  });
  const endOfWeek = getEndOfWeek(day, {
    in: tz(timeZone),
  });

  const startUtc = transpose(startOfWeek, tz("UTC"));
  const endUtc = transpose(endOfWeek, tz("UTC"));

  return {
    startUtc,
    endUtc,
  };
};

export const getLocalMonthBounds = (day: Date, timeZone: string) => {
  const startOfMonth = getStartOfMonth(day, {
    in: tz(timeZone),
  });
  const endOfMonth = getEndOfMonth(day, {
    in: tz(timeZone),
  });

  const startUtc = transpose(startOfMonth, tz("UTC"));
  const endUtc = transpose(endOfMonth, tz("UTC"));

  return {
    startUtc,
    endUtc,
  };
};

export const formatTimeInput = (time: Date) => {
  if (!time) return;

  return format(time, "HH:mm:ss");
};

export const nullifyZodSchema = <T extends z.ZodObject>(shape: T) => {
  const entries = Object.entries(shape).map(([key, value]) => [
    key,
    value.nullish(),
  ]);
  return z.object(Object.fromEntries(entries));
};

export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};
