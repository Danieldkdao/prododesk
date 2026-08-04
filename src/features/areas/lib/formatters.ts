import { AreasSortByOption } from "./areas-params";

export const formatAreasSortByOption = (option: AreasSortByOption) => {
  switch (option) {
    case "oldest":
      return "Oldest";
    case "position":
      return "Position";
    case "recently_created":
      return "Recently created";
    case "recently_updated":
      return "Recently updated";
    default:
      throw new Error(`Unknown area sort by option: ${option satisfies never}`);
  }
};
