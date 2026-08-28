import { envClient } from "@/data/env/client";
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
  const startUtc = getStartOfDay(day, {
    in: tz(timeZone),
  });
  const endUtc = getEndOfDay(day, {
    in: tz(timeZone),
  });

  return {
    startUtc,
    endUtc,
  };
};

export const getLocalWeekBounds = (day: Date, timeZone: string) => {
  const startUtc = getStartOfWeek(day, {
    in: tz(timeZone),
  });
  const endUtc = getEndOfWeek(day, {
    in: tz(timeZone),
  });

  return {
    startUtc,
    endUtc,
  };
};

export const getLocalMonthBounds = (day: Date, timeZone: string) => {
  const startUtc = getStartOfMonth(day, {
    in: tz(timeZone),
  });
  const endUtc = getEndOfMonth(day, {
    in: tz(timeZone),
  });

  return {
    startUtc,
    endUtc,
  };
};

export const formatTimeInput = (time: Date) => {
  if (!time) return;

  return format(time, "HH:mm:ss");
};

export const nullifyZodSchema = <T extends z.ZodObject>(schema: T) => {
  const entries = Object.entries(schema.shape).map(([key, value]) => [
    key,
    value.nullish(),
  ]);
  return z.object(Object.fromEntries(entries));
};

export const isValidDate = (date: unknown): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const generateFileUrl = (key: string) => {
  return `https://${envClient.NEXT_PUBLIC_TIGRIS_STORAGE_BUCKET}.t3.tigrisfiles.io/${key}`;
};

export const isError = (error: unknown): error is Error =>
  error instanceof Error;
