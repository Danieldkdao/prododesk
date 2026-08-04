"use client";

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useProjectsParams } from "../hooks/use-projects-params";
import {
  readProjectsAction,
  ReadProjectsActionReturnType,
} from "../actions/actions";
import { ProjectCard } from "./project-card";
import { InfoCard } from "@/components/info-card";
import { SearchXIcon } from "lucide-react";
import { ProjectSkeleton } from "./projects-skeleton";

export const ProjectsInfiniteList = ({
  initialProjects,
  initialHasNextPage,
}: {
  initialProjects: ReadProjectsActionReturnType["projects"];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useProjectsParams();
  const {
    items: projects,
    isPending,
    setSentinelEl,
  } = useInfiniteScroll<
    ReadProjectsActionReturnType["projects"][number],
    "projects"
  >(
    initialProjects,
    initialHasNextPage,
    (nextPage) => readProjectsAction({ ...filters, page: nextPage }),
    {
      additionalScrollDeps: [filters],
    },
  );

  return projects.length ? (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
      {isPending &&
        Array.from({ length: 8 }).map((_, index) => (
          <ProjectSkeleton key={index} />
        ))}
      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <InfoCard
      title="No projects found"
      description="We weren't able to find any of your projects. Create a new one to get started or update your search filters."
      icon={<SearchXIcon />}
    />
  );
};
