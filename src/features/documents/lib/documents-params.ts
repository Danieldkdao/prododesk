import { createLoader, parseAsString, parseAsStringEnum } from "nuqs/server";

export const documentsSortByOptions = [
  "recently_created",
  "oldest",
  "recently_updated",
] as const;
export type DocumentsSortByOption = (typeof documentsSortByOptions)[number];

const filterSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...documentsSortByOptions])
    .withDefault("recently_created")
    .withOptions({ clearOnDefault: true }),
};
export const loadDocumentsSearchParams = createLoader(filterSearchParams);
