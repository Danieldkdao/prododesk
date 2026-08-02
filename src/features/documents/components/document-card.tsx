import { Card, CardContent } from "@/components/ui/card";
import { ReadDocumentsActionReturnType } from "../actions/actions";
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { formatColor } from "@/lib/formatters";
import Link from "next/link";
import { EllipsisIcon, FileTextIcon, FolderKanbanIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { TiptapMarkdownRenderer } from "@/components/markdown/tiptap-markdown-renderer";

export const DocumentCard = ({
  document,
}: {
  document: ReadDocumentsActionReturnType[number];
}) => {
  return (
    <Card className="group p-0 transition-colors hover:bg-muted/30 border relative h-full">
      <CardContent className="p-0">
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
        <div className="flex items-center justify-center gap-2 p-4">
          {document.project ? (
            (() => {
              if (!document.project) return null;
              const { bgLight, text } = formatColor(document.project.color);

              return (
                <TooltipWrapper content={document.project.name}>
                  <Link href={`/dashboard/projects/${document.project.id}`}>
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
            <h3 className="truncate text-xl font-semibold">
              {document.name || "Untitled"}
            </h3>
            <p className="mt-0.5 text-base text-muted-foreground">
              Edited{" "}
              {formatDistanceToNow(document.updatedAt, {
                addSuffix: true,
                includeSeconds: true,
              })}
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 relative z-10 self-start opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
          >
            <EllipsisIcon />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
