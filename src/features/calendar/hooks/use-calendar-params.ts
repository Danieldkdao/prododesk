import { parseAsIsoDate, parseAsIsoDateTime, useQueryStates } from "nuqs";

export const useCalendarParams = () => {
  return useQueryStates(
    {
      month: parseAsIsoDateTime
        .withDefault(new Date())
        .withOptions({ clearOnDefault: true }),
      day: parseAsIsoDate.withOptions({ clearOnDefault: true }),
    },
    { shallow: false },
  );
};
