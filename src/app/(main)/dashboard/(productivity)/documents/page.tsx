import { ErrorState } from "@/components/error-state";
import { InfoCard } from "@/components/info-card";
import { Skeleton } from "@/components/ui/skeleton";
import { readDocumentsAction } from "@/features/documents/actions/actions";
import { CreateDocumentButton } from "@/features/documents/components/create-document-button";
import { DocumentCard } from "@/features/documents/components/document-card";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const DocumentsPage = () => {
  return (
    <div className="w-full h-full flex flex-col gap-8">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Documents</h1>
        <CreateDocumentButton projectId="1aab756f-ec90-407e-ae21-bbe0be7e0303">
          <PlusIcon />
          Create document
        </CreateDocumentButton>
      </div>
      <Suspense fallback={<DocumentsLoading />}>
        <DocumentsSuspense />
      </Suspense>
    </div>
  );
};

const DocumentsLoading = () => {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="flex h-full flex-col overflow-hidden border bg-card shadow-sm"
        >
          <div className="h-80 border-b p-4">
            <div className="h-full space-y-3 overflow-hidden border bg-accent/30 p-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-4/5" />
              <div className="pt-3">
                <Skeleton className="mb-3 h-4 w-1/2" />
                <Skeleton className="mb-2 h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
          <div className="flex flex-1 items-center gap-3 p-4">
            <Skeleton className="size-12 shrink-0" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-4 w-2/5" />
            </div>
            <Skeleton className="size-8 shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
};

const DocumentsSuspense = async () => {
  const documents = await readDocumentsAction();
  if (!documents) {
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to grab your documents. Try refreshing the page or come back later if the issue persists."
      />
    );
  }

  if (!documents.length) {
    return (
      <InfoCard
        title="No documents found"
        description="Looks like you haven't created any documents yet. Create one to get started."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {documents.map((document) => (
        <DocumentCard key={document.id} document={document} />
      ))}
    </div>
  );
};

export default DocumentsPage;
