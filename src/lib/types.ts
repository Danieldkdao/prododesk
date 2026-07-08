import { Dispatch, SetStateAction } from "react";

export type SetterType<T> = Dispatch<SetStateAction<T>>;
