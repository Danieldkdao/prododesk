import {
  addDays,
  differenceInCalendarDays as getDifferenceInCalendarDays,
  eachDayOfInterval as getEachDayOfInterval,
  endOfMonth as getEndOfMonth,
  endOfWeek as getEndOfWeek,
  startOfMonth as getStartOfMonth,
  startOfWeek as getStartOfWeek,
  subDays,
} from "date-fns";
import { create } from "zustand";

type MainCalendarStoreType = {
  today: Date;
  dateToUse: Date;
  startOfMonth: Date;
  endOfMonth: Date;
  weekDays: Date[];
  monthDays: Date[];
  setDateToUse: (date: Date) => void;
};

const today = new Date();
const dateToUse = getStartOfMonth(today);

const calculateCalendarValues = (
  dateToUse: Date,
): Omit<MainCalendarStoreType, "setDateToUse" | "today" | "dateToUse"> => {
  const startOfMonth = getStartOfMonth(dateToUse);
  const endOfMonth = getEndOfMonth(dateToUse);
  const weekDays = getEachDayOfInterval({
    start: getStartOfWeek(dateToUse, { weekStartsOn: 1 }),
    end: getEndOfWeek(dateToUse, { weekStartsOn: 1 }),
  });
  const differenceInFirstDays = getDifferenceInCalendarDays(
    startOfMonth,
    getStartOfWeek(startOfMonth, { weekStartsOn: 1 }),
  );
  const differenceInLastDays = getDifferenceInCalendarDays(
    getEndOfWeek(endOfMonth, { weekStartsOn: 1 }),
    endOfMonth,
  );
  const monthDays = getEachDayOfInterval({
    start: subDays(startOfMonth, differenceInFirstDays),
    end: addDays(endOfMonth, differenceInLastDays),
  });

  return { startOfMonth, endOfMonth, weekDays, monthDays };
};

const { startOfMonth, endOfMonth, weekDays, monthDays } =
  calculateCalendarValues(dateToUse);

export const useMainCalendarStore = create<MainCalendarStoreType>((set) => ({
  today: new Date(),
  dateToUse,
  startOfMonth,
  endOfMonth,
  weekDays,
  monthDays,
  setDateToUse: (date) => {
    const calculatedValues = calculateCalendarValues(date);

    set({
      dateToUse: date,
      ...calculatedValues,
    });
  },
}));
