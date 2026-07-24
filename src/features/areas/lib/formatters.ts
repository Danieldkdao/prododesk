import { AreaStatus } from "@/db/shared";

export const formatAreaStatus = (status: AreaStatus) => {
  switch (status) {
    case "active":
      return "Active";
    case "archived":
      return "Archived";
    default:
      throw new Error(`Unknown area status: ${status satisfies never}`);
  }
};
