import { ErrorState } from "@/components/error-state";
import { ArrowLeftIcon } from "@/components/tiptap/tiptap-icons/arrow-left-icon";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { readDocumentAction } from "@/features/documents/actions/actions";
import { DocumentEditor } from "@/features/documents/components/document-editor";
import { ParamsId } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";

type DocumentIdParams = ParamsId<"documentId">;

const DocumentIdPage = (props: DocumentIdParams) => {
  return (
    <Suspense fallback={<DocumentIdLoading />}>
      <DocumentIdSuspense {...props} />
    </Suspense>
  );
};

const DocumentIdLoading = () => {
  return (
    <div className="flex w-full flex-col items-start gap-4">
      <Skeleton className="h-9 w-40" />
      <div className="w-full border bg-card shadow-sm">
        <div className="space-y-3 border-b p-4">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="size-8 shrink-0" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
        <div className="flex h-11 items-center gap-2 overflow-hidden border-b px-3">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-7 w-px" />
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-7 w-px" />
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-7 w-px" />
          <Skeleton className="h-7 w-28" />
        </div>
        <div className="mx-auto min-h-128 w-full max-w-210.5 space-y-5 p-6 md:p-12">
          <Skeleton className="h-9 w-3/5" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-7 w-2/5" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  );
};

const DocumentIdSuspense = async ({ params }: DocumentIdParams) => {
  const { documentId } = await params;
  const document = await readDocumentAction(documentId);
  if (!document) {
    return (
      <ErrorState
        title="Document not found"
        description="We were unable to load that document. Make sure that you own this document and that it exists. You can also try reloading the page."
      />
    );
  }

  return (
    <div className="w-full flex flex-col items-start gap-4">
      <Link
        href="/dashboard/documents"
        className={cn(buttonVariants({ variant: "outline" }))}
      >
        <ArrowLeftIcon />
        Back to documents
      </Link>
      <DocumentEditor key={document.id} document={document} />
    </div>
  );
};

export default DocumentIdPage;
