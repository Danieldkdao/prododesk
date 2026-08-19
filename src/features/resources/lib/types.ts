import {
  AreaSelectType,
  ChatSelectType,
  DocumentSelectType,
  MilestoneSelectType,
  ProjectSelectType,
  TaskSelectType,
} from "@/db/schema";
import { resources } from "./constants";

export type ResourceType = (typeof resources)[number];

export type ResourceData =
  | {
      resource: "areas";
      item: AreaSelectType;
      onSelect: (item: AreaSelectType) => void;
    }
  | {
      resource: "projects";
      item: ProjectSelectType;
      onSelect: (item: ProjectSelectType) => void;
    }
  | {
      resource: "tasks";
      item: TaskSelectType;
      onSelect: (item: TaskSelectType) => void;
    }
  | {
      resource: "milestones";
      item: MilestoneSelectType;
      onSelect: (item: MilestoneSelectType) => void;
    }
  | {
      resource: "documents";
      item: DocumentSelectType;
      onSelect: (item: DocumentSelectType) => void;
    }
  | {
      resource: "chats";
      item: ChatSelectType;
      onSelect: (item: ChatSelectType) => void;
    };
