"use client";

import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";
import { Input } from "@/components/ui/input";
import { useAsyncDebouncer } from "@tanstack/react-pacer";
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
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ReadDocumentActionReturnType,
  updateDocumentAction,
} from "../actions/actions";
import { DeleteDocumentButton } from "./delete-document-button";

const getDocumentSignature = (values: { name: string; content: string }) =>
  JSON.stringify(values);

type DocumentValues = {
  name: string;
  content: string;
};

export const DocumentEditor = ({
  document,
}: {
  document: ReadDocumentActionReturnType;
}) => {
  const router = useRouter();
  const [documentValues, setDocumentValues] = useState<DocumentValues>({
    name: document.name,
    content: document.content,
  });
  const [savePending, setSavePending] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "error" | null>(null);
  const isUnmountingRef = useRef(false);
  const pendingSaveCountRef = useRef(0);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const lastSavedRef = useRef(
    getDocumentSignature({
      name: document.name,
      content: document.content,
    }),
  );

  const saveDebouncer = useAsyncDebouncer(
    async (values: DocumentValues) => {
      const documentSignature = getDocumentSignature(values);
      if (documentSignature === lastSavedRef.current) return;

      pendingSaveCountRef.current += 1;
      if (!isUnmountingRef.current) {
        setSavePending(true);
        setSaveStatus(null);
      }

      const save = async () => {
        const response = await updateDocumentAction(document.id, values);

        if (response.error) {
          if (!isUnmountingRef.current) setSaveStatus("error");
          return;
        }

        lastSavedRef.current = documentSignature;
        if (!isUnmountingRef.current) {
          setSaveStatus("saved");
        } else {
          router.refresh();
        }
      };

      const queuedSave = saveQueueRef.current.then(save, save);
      saveQueueRef.current = queuedSave;

      try {
        await queuedSave;
      } finally {
        pendingSaveCountRef.current -= 1;
        if (!isUnmountingRef.current) {
          setSavePending(pendingSaveCountRef.current > 0);
        }
      }
    },
    {
      wait: 500,
      throwOnError: false,
      onError: () => {
        if (!isUnmountingRef.current) {
          setSaveStatus("error");
          setSavePending(false);
        }
      },
      onUnmount: (debouncer) => {
        isUnmountingRef.current = true;
        void debouncer.flush();
      },
    },
  );

  useEffect(() => {
    const documentSignature = getDocumentSignature(documentValues);
    if (documentSignature === lastSavedRef.current) return;

    void saveDebouncer.maybeExecute(documentValues);
  }, [documentValues, saveDebouncer]);

  useEffect(() => {
    const serverValues = {
      name: document.name,
      content: document.content,
    };
    const serverSignature = getDocumentSignature(serverValues);

    setDocumentValues((currentValues) => {
      const currentSignature = getDocumentSignature(currentValues);
      if (currentSignature !== lastSavedRef.current) return currentValues;

      lastSavedRef.current = serverSignature;
      return serverSignature === currentSignature
        ? currentValues
        : serverValues;
    });
  }, [document.content, document.name]);

  return (
    <div className="border bg-card shadow-sm w-full">
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
          <DeleteDocumentButton
            documentId={document.id}
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2Icon className="size-4" />
          </DeleteDocumentButton>
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
