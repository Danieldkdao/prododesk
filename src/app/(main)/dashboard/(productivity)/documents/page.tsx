import { ErrorState } from "@/components/error-state";
import { readDocumentsAction } from "@/features/documents/actions/actions";
import { CreateDocumentButton } from "@/features/documents/components/create-document-button";
import { DocumentFilters } from "@/features/documents/components/document-filters";
import { DocumentInfiniteList } from "@/features/documents/components/document-infinite-list";
import { DocumentsSkeleton } from "@/features/documents/components/documents-skeleton";
import { loadDocumentsSearchParams } from "@/features/documents/lib/documents-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { PlusIcon } from "lucide-react";
import { SearchParams } from "nuqs";
import { Suspense } from "react";

type DocumentsProps = { searchParams: Promise<SearchParams> };

const DocumentsPage = (props: DocumentsProps) => {
  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap justify-between">
        <h1 className="text-3xl font-semibold">My Documents</h1>
        <CreateDocumentButton projectId="1aab756f-ec90-407e-ae21-bbe0be7e0303">
          <PlusIcon />
          Create document
        </CreateDocumentButton>
      </div>
      <Suspense fallback={<DocumentsLoading />}>
        <DocumentsSuspense {...props} />
      </Suspense>
    </div>
  );
};

const DocumentsLoading = () => {
  return <DocumentsSkeleton />;
};

const DocumentsSuspense = async ({ searchParams }: DocumentsProps) => {
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
      <DocumentFilters />
      <DocumentInfiniteList
        key={metadata.clientKey}
        initialDocuments={documents}
        initialHasNextPage={metadata.hasNextPage}
      />
    </div>
  );
};

export default DocumentsPage;
