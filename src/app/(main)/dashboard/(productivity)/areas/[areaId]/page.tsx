import { readAreaAction } from "@/features/areas/actions/actions";
import { ParamsId } from "@/lib/types";

type AreaIdParams = ParamsId<"areaId">;

const AreaIdPage = (props: AreaIdParams) => {
  return <div>AreaIdPage</div>;
};

const AreaIdLoading = () => {
  return <div>loading</div>;
};

const AreaIdSuspense = async ({ params }: AreaIdParams) => {
  const { areaId } = await params;
  const area = await readAreaAction(areaId);
  if (!area) return null;

  const { tasks, documents } = area;

  return <div>suspense</div>;
};

export default AreaIdPage;
