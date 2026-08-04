"use client";

import { TiptapMarkdownRenderer } from "@/components/markdown/tiptap-markdown-renderer";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  EditIcon,
  EllipsisIcon,
  FileTextIcon,
  FolderKanbanIcon,
  Trash2Icon,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  ReadDocumentsActionReturnType,
  updateDocumentAction,
} from "../actions/actions";
import { DeleteDocumentButton } from "./delete-document-button";

export const DocumentCard = ({
  document,
}: {
  document: ReadDocumentsActionReturnType["documents"][number];
}) => {
  const updateInputRef = useRef<HTMLInputElement>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [documentName, setDocumentName] = useState(document.name || "Untitled");

  const updateAction = async () => {
    if (!isEditMode || documentName.trim() === document.name) return;
    setIsEditMode(false);

    const response = await updateDocumentAction(document.id, {
      name: documentName,
    });
    if (response.error) {
      toast.error(response.error);
    }
  };

  return (
    <Card className="group p-0 transition-colors hover:bg-muted/30 border relative h-full">
      <CardContent className="p-0 h-full flex flex-col">
        <div className="h-80 border-b p-4 overflow-hidden">
          <div className="p-4 border bg-accent/30 h-full overflow-hidden">
            {document.content.trim() && (
              <div className="zoom-50">
                <TiptapMarkdownRenderer>
                  {document.content}
                </TiptapMarkdownRenderer>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 p-4 flex-1">
          {document.project ? (
            (() => {
              if (!document.project) return null;
              const { bgLight, text } = formatColor(document.project.color);

              return (
                <TooltipWrapper content={document.project.name}>
                  <Link
                    href={`/dashboard/projects/${document.project.id}/documents`}
                  >
                    <div
                      className={cn(
                        "flex size-12 shrink-0 items-center justify-center relative z-10",
                        bgLight,
                        text,
                      )}
                    >
                      {document.project.icon ? (
                        <span className="text-3xl">
                          {document.project.icon}
                        </span>
                      ) : (
                        <FolderKanbanIcon className="size-8" />
                      )}
                    </div>
                  </Link>
                </TooltipWrapper>
              );
            })()
          ) : (
            <div className="flex size-12 shrink-0 items-center justify-center bg-primary/10 text-primary">
              <FileTextIcon className="size-8" />
            </div>
          )}
          <Link href={`/dashboard/documents/${document.id}`}>
            <span className="absolute inset-0" />
          </Link>
          <div className="min-w-0 flex-1">
            {isEditMode ? (
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && isEditMode) {
                    await updateAction();
                  }
                }}
                className={cn(
                  "text-xl md:text-xl font-semibold font-heading h-auto p-0 border-0 relative z-10",
                  isEditMode && "ring-1 ring-primary",
                )}
                onBlur={updateAction}
                ref={updateInputRef}
              />
            ) : (
              <h3 className="truncate text-xl font-semibold">
                {documentName || "Untitled"}
              </h3>
            )}
            <p className="mt-0.5 text-base text-muted-foreground">
              Edited{" "}
              {formatDistanceToNow(document.updatedAt, {
                addSuffix: true,
                includeSeconds: true,
              })}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 relative z-10 self-start opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <EllipsisIcon />
                </Button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                <EditIcon />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                nativeButton
                variant="destructive"
                render={
                  <DeleteDocumentButton
                    documentId={document.id}
                    variant="destructive"
                    className="w-full h-auto py-2 px-3.5 justify-start bg-transparent focus:bg-destructive/10 dark:focus:bg-destructive/20"
                  >
                    <Trash2Icon />
                    Delete
                  </DeleteDocumentButton>
                }
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};
