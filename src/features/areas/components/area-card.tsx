"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import {
  ArchiveIcon,
  ClockIcon,
  EditIcon,
  EllipsisVerticalIcon,
  RefreshCcwIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { ReadUserAreasActionReturnType } from "../actions/actions";
import { AreaDialog } from "./area-dialog";
import { useState } from "react";
import { DeleteAreaButton } from "./delete-area-button";
import { ToggleAreaArchiveStatusButton } from "./toggle-area-archive-status-button";

export const AreaCard = ({
  area,
}: {
  area: ReadUserAreasActionReturnType["areas"][number];
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  return (
    <>
      <AreaDialog
        existingArea={area}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <Card
        className={cn(
          "border border-l-6 w-full h-full relative",
          formatColor(area.color).borderLeft,
        )}
      >
        {area.isArchived && (
          <div className="absolute z-10 inset-0 bg-muted/10 backdrop-blur-sm w-full h-full flex flex-col gap-0.5 items-center justify-center p-4">
            <h3 className="text-2xl font-semibold text-center">Archived</h3>
            <p className="text-muted-foreground text-lg text-center">
              This area has been archived since{" "}
              {area.archivedAt ? format(area.archivedAt, "PP") : "unknown"}.
            </p>
          </div>
        )}
        <CardHeader className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            {area.icon && (
              <div
                className={cn(
                  "size-10 shrink-0 flex items-center justify-center bg-muted",
                  formatColor(area.color).bgLight,
                )}
              >
                {area.icon}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-medium">{area.name}</h2>
              <Link href={`/dashboard/areas/${area.id}`}>
                <div className="absolute inset-0" />
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm">
                    <EllipsisVerticalIcon />
                  </Button>
                }
              />
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
                  <EditIcon />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton
                  render={
                    <ToggleAreaArchiveStatusButton
                      areaId={area.id}
                      newArchiveStatus={!area.isArchived}
                      variant="ghost"
                      className="w-full h-auto py-2 px-3.5 justify-start"
                    >
                      {area.isArchived ? (
                        <>
                          <RefreshCcwIcon />
                          Reactivate
                        </>
                      ) : (
                        <>
                          <ArchiveIcon />
                          Archive
                        </>
                      )}
                    </ToggleAreaArchiveStatusButton>
                  }
                ></DropdownMenuItem>
                <DropdownMenuItem
                  nativeButton
                  variant="destructive"
                  render={
                    <DeleteAreaButton
                      areaId={area.id}
                      variant="destructive"
                      className="w-full h-auto py-2 px-3.5 justify-start bg-transparent focus:bg-destructive/10 dark:focus:bg-destructive/20"
                    >
                      <Trash2Icon />
                      Delete
                    </DeleteAreaButton>
                  }
                ></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          {area.description ? (
            <p className="text-lg text-muted-foreground line-clamp-2">
              {area.description}
            </p>
          ) : (
            <span className="text-muted-foreground text-lg italic">
              No description provided
            </span>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex items-start gap-2 leading-6">
            <span className="h-[1lh] shrink-0 flex items-center">
              <ClockIcon className="size-5 text-muted-foreground" />
            </span>
            <span className="text-base text-muted-foreground">
              {`Last updated ${formatDistanceToNow(area.updatedAt, { includeSeconds: true, addSuffix: true })}`}
            </span>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};
