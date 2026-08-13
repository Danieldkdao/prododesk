import { LinkButton } from "@/components/link-button";
import { AreaIdHeader } from "@/features/areas/components/area-id-header";
import { ParamsId } from "@/lib/types";
import { ArrowLeftIcon } from "lucide-react";
import React, { ReactNode } from "react";

const AreaIdLayout = ({
  children,
  params,
}: { children: ReactNode } & ParamsId<"areaId">) => {
  return (
    <div className="w-full h-full flex flex-col gap-4 min-w-0">
      <LinkButton href="/dashboard/areas" variant="outline">
        <ArrowLeftIcon />
        Back to areas
      </LinkButton>
      <div className="w-full h-full flex flex-col gap-8 min-w-0">
        <AreaIdHeader params={params} />
        {children}
      </div>
    </div>
  );
};

export default AreaIdLayout;
