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
import { formatDistanceToNow } from "date-fns";
import {
  ClockIcon,
  EditIcon,
  EllipsisVerticalIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { ReadUserAreasActionReturnType } from "../actions/actions";
import { AreaDialog } from "./area-dialog";
import { useState } from "react";
import { DeleteAreaButton } from "./delete-area-button";

export const AreaCard = ({
  area,
}: {
  area: ReadUserAreasActionReturnType[number];
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  return (
    <>
      <AreaDialog
        existingArea={area}
        manualOpen={updateDialogOpen}
        setManualOpen={setUpdateDialogOpen}
      />
      <Card
        className={cn(
          "border border-l-6 w-full h-full relative",
          area.color && formatColor(area.color).borderLeft,
        )}
      >
        <CardHeader className="flex items-center gap-2 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            {area.icon && (
              <div
                className={cn(
                  "size-10 shrink-0 flex items-center justify-center bg-muted",
                  area.color && formatColor(area.color).bgLight,
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
          <div className="flex items-center gap-2">
            <ClockIcon className="size-5 text-muted-foreground" />
            <span className="text-base text-muted-foreground">
              {`Last updated ${formatDistanceToNow(area.updatedAt, { includeSeconds: true, addSuffix: true })}`}
            </span>
          </div>
        </CardFooter>
      </Card>
    </>
  );
};
