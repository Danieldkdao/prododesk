import { SQL } from "drizzle-orm";
import { SearchParams } from "nuqs";
import { Dispatch, SetStateAction } from "react";

export type ParamsId<T extends string> = {
  params: Promise<Record<T, string>>;
};
export type SearchParamsType = { searchParams: Promise<SearchParams> };
export type SetterType<T> = Dispatch<SetStateAction<T>>;
export type UnwrapAsync<T extends (...params: any[]) => unknown> = NonNullable<
  Awaited<ReturnType<T>>
>;
export type SQLUpdateMap<T> = {
  [K in keyof T]: T[K] | SQL<unknown>;
};
