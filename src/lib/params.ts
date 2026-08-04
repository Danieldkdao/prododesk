export const archiveStatusFilterOptions = [
  "all",
  "active",
  "archived",
] as const;
export type ArchiveStatusFilterOption =
  (typeof archiveStatusFilterOptions)[number];
