import { ActivitySelectType, ArtifactSelectType } from "@/db/schema";

export type ArtifactActivityType = ArtifactSelectType & {
  activity?: ActivitySelectType | null;
};
