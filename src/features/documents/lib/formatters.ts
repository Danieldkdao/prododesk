import { DocumentsSortByOption } from "./documents-params";

export const formatDocumentSortByOption = (option: DocumentsSortByOption) => {
  switch (option) {
    case "oldest":
      return "Oldest";
    case "recently_created":
      return "Recently created";
    case "recently_updated":
      return "Recently updated";
    default:
      throw new Error(`Unknown option: ${option satisfies never}`);
  }
};
