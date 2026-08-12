import { ErrorState } from "@/components/error-state";
import { readDocumentsAction } from "@/features/documents/actions/actions";
import { DocumentsFilters } from "@/features/documents/components/documents-filters";
import { DocumentsInfiniteList } from "@/features/documents/components/documents-infinite-list";
import { DocumentsSkeleton } from "@/features/documents/components/documents-skeleton";
import { loadDocumentsSearchParams } from "@/features/documents/lib/documents-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type AreaIdDocumentsParams = ParamsId<"areaId"> & SearchParamsType;

const AreaIdDocumentsPage = (props: AreaIdDocumentsParams) => {
  return (
    <Suspense fallback={<DocumentsSkeleton />}>
      <AreaIdDocumentsSuspense {...props} />
    </Suspense>
  );
};

const AreaIdDocumentsSuspense = async ({
  params,
  searchParams,
}: AreaIdDocumentsParams) => {
  const { areaId } = await params;
  const filters = await loadDocumentsSearchParams(searchParams);

  const response = await readDocumentsAction({
    ...filters,
    areaIds: [areaId],
    page: DEFAULT_PAGE,
  });
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your documents in this area. Try refreshing the page or checking the URL."
      />
    );
  }

  const { documents, metadata } = response;

  return (
    <div className="flex flex-col gap-4">
      <DocumentsFilters />
      <DocumentsInfiniteList
        initialDocuments={documents}
        initialHasNextPage={metadata.hasNextPage}
        areaIds={[areaId]}
      />
    </div>
  );
};

export default AreaIdDocumentsPage;
