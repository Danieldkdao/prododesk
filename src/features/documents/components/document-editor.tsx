"use client";

import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSaveStatus } from "@/hooks/use-save-status";
import { useDebouncedValue } from "@tanstack/react-pacer";
import { format } from "date-fns";
import {
  CheckIcon,
  ClockIcon,
  FolderKanbanIcon,
  LoaderIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ReadDocumentActionReturnType,
  updateDocumentAction,
} from "../actions/actions";

const getDocumentSignature = (values: { name: string; content: string }) =>
  JSON.stringify(values);

export const DocumentEditor = ({
  document,
}: {
  document: ReadDocumentActionReturnType;
}) => {
  const [documentValues, setDocumentValues] = useState<{
    name: string;
    content: string;
  }>({ name: document.name, content: document.content });
  const debouncedDocument = useDebouncedValue(documentValues, { wait: 1000 });
  const debouncedDocumentValues = debouncedDocument["0"];
  const { savePending, startSave, setSaveStatus, saveStatus } = useSaveStatus();
  const lastSubmittedRef = useRef(
    getDocumentSignature({
      name: document.name,
      content: document.content,
    }),
  );

  useEffect(() => {
    const documentSignature = getDocumentSignature(debouncedDocumentValues);
    console.log("DOCUMENT SIGNATURE: ", documentSignature);
    console.log("LAST SUBMITTED: ", lastSubmittedRef.current);
    if (documentSignature === lastSubmittedRef.current) return;

    lastSubmittedRef.current = documentSignature;

    startSave(async () => {
      const response = await updateDocumentAction(
        document.id,
        debouncedDocumentValues,
      );
      setSaveStatus(response.error ? "error" : "saved");
    });
  }, [debouncedDocumentValues, document.id, startSave, setSaveStatus]);

  return (
    <div className="border bg-card shadow-sm">
      <div className="flex flex-col gap-2 border-b p-4">
        <div className="flex items-center justify-between gap-4">
          <Input
            value={documentValues.name}
            onChange={(e) =>
              setDocumentValues((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Untitled document"
            className="h-auto border-none bg-transparent p-0 text-2xl font-semibold shadow-none focus-visible:ring-0 md:text-2xl"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <ClockIcon className="size-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Created on {format(document.createdAt, "PPP")}
            </span>
          </div>
          {document.project && (
            <Link href={`/dashboard/projects/${document.project.id}`}>
              <div className="flex items-center gap-2 rounded-xl">
                {document.project.icon ? (
                  <span>{document.project.icon}</span>
                ) : (
                  <FolderKanbanIcon className="size-5" />
                )}
                <span>{document.project.name}</span>
              </div>
            </Link>
          )}
          <div className="flex items-center gap-2">
            {savePending ? (
              <>
                <LoaderIcon className="text-muted-foreground size-5 animate-spin" />
                <span className="text-muted-foreground">Saving</span>
              </>
            ) : saveStatus ? (
              saveStatus === "saved" ? (
                <>
                  <CheckIcon className="text-emerald-500 size-5" />
                  <span className="text-emerald-500">Saved</span>
                </>
              ) : saveStatus === "error" ? (
                <>
                  <XIcon className="text-destructive size-5" />
                  <span className="text-destructive">Failed to save</span>
                </>
              ) : null
            ) : null}
          </div>
        </div>
      </div>
      <div className="pb-4">
        <SimpleEditor
          value={documentValues.content}
          onValueChange={(value) =>
            setDocumentValues((prev) => ({ ...prev, content: value }))
          }
        />
      </div>
    </div>
  );
};
