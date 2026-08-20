import { useQueryStates } from "nuqs";
import { documentsSearchParams } from "../lib/documents-params";

export const useDocumentsParams = () => {
  return useQueryStates(documentsSearchParams, { shallow: false });
};
