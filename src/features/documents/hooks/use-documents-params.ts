import { parseAsString, parseAsStringEnum, useQueryStates } from "nuqs";
import { documentsSortByOptions } from "../lib/documents-params";

export const useDocumentsParams = () => {
  return useQueryStates(
    {
      search: parseAsString
        .withDefault("")
        .withOptions({ clearOnDefault: true }),
      sortBy: parseAsStringEnum([...documentsSortByOptions])
        .withDefault("recently_created")
        .withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
