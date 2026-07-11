import { Dispatch, SetStateAction } from "react";

export type SetterType<T> = Dispatch<SetStateAction<T>>;
export type UnwrapAsync<T extends (...params: any[]) => unknown> = Awaited<
  ReturnType<T>
>;
