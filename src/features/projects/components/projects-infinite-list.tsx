"use client";

import { NotFound } from "@/components/not-found";
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import { useCallback } from "react";
import {
  readProjectsAction,
  ReadProjectsActionReturnType,
} from "../actions/actions";
import { useProjectsParams } from "../hooks/use-projects-params";
import { ProjectCard } from "./project-card";
import { ProjectSkeleton } from "./projects-skeleton";

export const ProjectsInfiniteList = ({
  areaId,
  initialProjects,
  initialHasNextPage,
}: {
  areaId?: string;
  initialProjects: ReadProjectsActionReturnType["projects"];
  initialHasNextPage: boolean;
}) => {
  const [filters] = useProjectsParams();

  const fetchProjects = useCallback(
    (nextPage: number) => {
      return readProjectsAction({
        ...filters,
        areaIds: areaId ? [areaId] : undefined,
        page: nextPage,
      });
    },
    [filters, areaId],
  );

  const {
    items: projects,
    isPending,
    setSentinelEl,
  } = useInfiniteScroll<
    ReadProjectsActionReturnType["projects"][number],
    "projects"
  >(initialProjects, initialHasNextPage, fetchProjects, {
    additionalScrollDeps: [areaId, filters],
  });

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
    <NotFound
      title="No projects found"
      description="We weren't able to find any of your projects. Create a new one to get started or update your search filters."
    />
  );
};
