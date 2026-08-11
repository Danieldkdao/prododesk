"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AreaSelectType } from "@/db/schema";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  EditIcon,
  Trash2Icon,
} from "lucide-react";
import { ReactElement, useState } from "react";
import { AreaDialog } from "./area-dialog";
import { DeleteAreaButton } from "./delete-area-button";
import { ToggleAreaArchiveStatusButton } from "./toggle-area-archive-status-button";

export const AreaOptions = ({
  area,
  children,
}: {
  area: AreaSelectType;
  children: ReactElement;
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  return (
    <>
      <AreaDialog
        existingArea={area}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <DropdownMenu>
        <DropdownMenuTrigger render={children} />
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
                    <ArchiveRestoreIcon />
                    Restore
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
    </>
  );
};
