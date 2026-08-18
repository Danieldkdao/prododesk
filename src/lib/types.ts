import { SQL } from "drizzle-orm";
import { SearchParams } from "nuqs";
import { Dispatch, SetStateAction } from "react";
import { resources } from "./constants";

export type ParamsId<T extends string> = {
  params: Promise<Record<T, string>>;
};
export type SearchParamsType = { searchParams: Promise<SearchParams> };
export type SetterType<T> = Dispatch<SetStateAction<T>>;
export type UnwrapAsync<T extends (...params: any[]) => unknown> = NonNullable<
  Awaited<ReturnType<T>>
>;
export type SQLMap<T> = {
  [K in keyof T]: T[K] | SQL<unknown>;
};

export type PartialNull<T> = {
  [K in keyof T]: T[K] | undefined | null;
};

export type ResourceType = (typeof resources)[number]["value"];
