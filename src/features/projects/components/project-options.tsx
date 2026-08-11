"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProjectSelectType } from "@/db/schema";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  EditIcon,
  Trash2Icon,
} from "lucide-react";
import { ReactElement, useState } from "react";
import { DeleteProjectButton } from "./delete-project-button";
import { ProjectDialog } from "./project-dialog";
import { ToggleProjectArchiveStatusButton } from "./toggle-project-archive-status-button";

export const ProjectOptions = ({
  children,
  project,
  className,
}: {
  children: ReactElement;
  project: ProjectSelectType & {
    area?: { name: string; icon?: string | null } | null;
  };
  className?: string;
}) => {
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);

  return (
    <>
      <ProjectDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        existingProject={project}
        defaultValues={{
          area: project.area,
        }}
      />
      <DropdownMenu>
        <DropdownMenuTrigger className={className} render={children} />
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => setUpdateDialogOpen(true)}>
            <EditIcon />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            nativeButton
            render={
              <ToggleProjectArchiveStatusButton
                projectId={project.id}
                newArchiveStatus={!project.isArchived}
                className="w-full h-auto py-2 px-3.5 justify-start bg-transparent"
                variant="ghost"
              >
                {project.isArchived ? (
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
              </ToggleProjectArchiveStatusButton>
            }
          />
          <DropdownMenuItem
            nativeButton
            variant="destructive"
            render={
              <DeleteProjectButton
                projectId={project.id}
                className="w-full h-auto py-2 px-3.5 justify-start bg-transparent focus:bg-destructive/10 dark:focus:bg-destructive/20"
              >
                <Trash2Icon />
                Delete
              </DeleteProjectButton>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
