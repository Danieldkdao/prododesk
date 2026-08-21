import {
  createLoader,
  parseAsString,
  parseAsStringEnum,
  type inferParserType,
} from "nuqs/server";

export const documentsSortByOptions = [
  "recently_created",
  "oldest",
  "recently_updated",
] as const;
export type DocumentsSortByOption = (typeof documentsSortByOptions)[number];

export const documentsSearchParams = {
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...documentsSortByOptions])
    .withDefault("recently_created")
    .withOptions({ clearOnDefault: true }),
};
export type DocumentsFilters = inferParserType<typeof documentsSearchParams>;

export const loadDocumentsSearchParams = createLoader(documentsSearchParams);
