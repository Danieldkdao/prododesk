import { ErrorState } from "@/components/error-state";
import { readDocumentsAction } from "@/features/documents/actions/actions";
import { CreateDocumentButton } from "@/features/documents/components/create-document-button";
import { DocumentsFilters } from "@/features/documents/components/documents-filters";
import { DocumentsInfiniteList } from "@/features/documents/components/documents-infinite-list";
import { DocumentsSkeleton } from "@/features/documents/components/documents-skeleton";
import { loadDocumentsSearchParams } from "@/features/documents/lib/documents-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { SearchParamsType } from "@/lib/types";
import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

const DocumentsPage = (props: SearchParamsType) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Documents</h1>
        <CreateDocumentButton>
          <PlusIcon />
          Create
        </CreateDocumentButton>
      </div>
      <Suspense fallback={<DocumentsSkeleton />}>
        <DocumentsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const DocumentsSuspense = async ({ searchParams }: SearchParamsType) => {
  const filters = await loadDocumentsSearchParams(searchParams);
  const response = await readDocumentsAction({
    ...filters,
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="Due to an unexpected error, we were unable to grab your documents. Try refreshing the page or come back later if the issue persists."
      />
    );
  }

  const { documents, metadata } = response;

  return (
    <div className="w-full flex flex-col gap-8">
      <DocumentsFilters />
      <DocumentsInfiniteList
        key={metadata.clientKey}
        initialDocuments={documents}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default DocumentsPage;
