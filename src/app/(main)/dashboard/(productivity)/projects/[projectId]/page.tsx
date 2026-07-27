import { readProjectAction } from "@/features/projects/actions/actions";
import { ParamsId } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdParams = ParamsId<"projectId">;

const ProjectIdPage = (props: ProjectIdParams) => {
  return (
    <Suspense fallback={<ProjectIdLoading />}>
      <ProjectIdSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdLoading = () => {
  return <div>loading</div>;
};

const ProjectIdSuspense = async ({ params }: ProjectIdParams) => {
  const { projectId } = await params;

  const project = await readProjectAction(projectId);

  return (
    <div className="w-full h-full flex flex-col gap-8 min-w-0">overview</div>
  );
};

export default ProjectIdPage;
