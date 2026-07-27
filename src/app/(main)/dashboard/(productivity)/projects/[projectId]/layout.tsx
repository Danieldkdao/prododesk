import { ProjectIdHeader } from "@/features/projects/components/project-id-header";
import { ParamsId } from "@/lib/types";
import { ReactNode } from "react";

const ProjectIdLayout = ({
  children,
  params,
}: { children: ReactNode } & ParamsId<"projectId">) => {
  return (
    <div className="w-full h-full flex flex-col gap-8 min-w-0">
      <ProjectIdHeader params={params} />
      {children}
    </div>
  );
};

export default ProjectIdLayout;
