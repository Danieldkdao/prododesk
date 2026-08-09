import { ErrorState } from "@/components/error-state";
import { readDocumentsAction } from "@/features/documents/actions/actions";
import { DocumentsInfiniteList } from "@/features/documents/components/documents-infinite-list";
import { DocumentsFilters } from "@/features/documents/components/documents-filters";
import { DocumentsSkeleton } from "@/features/documents/components/documents-skeleton";
import { loadDocumentsSearchParams } from "@/features/documents/lib/documents-params";
import { DEFAULT_PAGE } from "@/lib/constants";
import { ParamsId, SearchParamsType } from "@/lib/types";
import { Suspense } from "react";

type ProjectIdDocumentsProps = ParamsId<"projectId"> & SearchParamsType;

const ProjectIdDocumentsPage = (props: ProjectIdDocumentsProps) => {
  return (
    <Suspense fallback={<DocumentsSkeleton />}>
      <ProjectIdDocumentsSuspense {...props} />
    </Suspense>
  );
};

const ProjectIdDocumentsSuspense = async ({
  params,
  searchParams,
}: ProjectIdDocumentsProps) => {
  const { projectId } = await params;
  const filters = await loadDocumentsSearchParams(searchParams);

  const response = await readDocumentsAction(
    { ...filters, page: DEFAULT_PAGE },
    [projectId],
  );
  if (!response) {
    return (
      <ErrorState
        title="An error occurred"
        description="We were unable to load your documents for this project. Try checking the URL or refreshing the page."
      />
    );
  }

  const { documents, metadata } = response;

  return (
    <div className="w-full flex flex-col gap-4">
      <DocumentsFilters projectId={projectId} />
      <DocumentsInfiniteList
        key={metadata.clientKey}
        initialDocuments={documents}
        initialHasNextPage={metadata.hasNextPage}
        projectIds={[projectId]}
      />
    </div>
  );
};

export default ProjectIdDocumentsPage;
