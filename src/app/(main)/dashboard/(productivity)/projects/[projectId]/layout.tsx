import { LinkButton } from "@/components/link-button";
import { ProjectIdHeader } from "@/features/projects/components/project-id-header";
import { ParamsId } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";
import { ReactNode } from "react";

const ProjectIdLayout = ({
  children,
  params,
}: { children: ReactNode } & ParamsId<"projectId">) => {
  return (
    <div className="w-full h-full flex flex-col gap-4 min-w-0">
      <LinkButton href="/dashboard/projects" variant="outline">
        <ArrowLeftIcon />
        Back to projects
      </LinkButton>
      <div className="w-full h-full flex flex-col gap-8 min-w-0">
        <ProjectIdHeader params={params} />
        {children}
      </div>
    </div>
  );
};

export default ProjectIdLayout;
