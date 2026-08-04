"use client";

import { useInfiniteScroll } from "@/hooks/use-infinite-scroll";
import {
  readDocumentsAction,
  ReadDocumentsActionReturnType,
} from "../actions/actions";
import { useDocumentsParams } from "../hooks/use-documents-params";
import { DocumentCard } from "./document-card";
import { DocumentSkeleton } from "./documents-skeleton";
import { InfoCard } from "@/components/info-card";
import { SearchXIcon } from "lucide-react";

export const DocumentsInfiniteList = ({
  initialDocuments,
  initialHasNextPage,
  projectIds,
}: {
  initialDocuments: ReadDocumentsActionReturnType["documents"];
  initialHasNextPage: boolean;
  projectIds?: string[];
}) => {
  const [filters] = useDocumentsParams();
  const {
    items: documents,
    isPending,
    setSentinelEl,
  } = useInfiniteScroll<
    ReadDocumentsActionReturnType["documents"][number],
    "documents"
  >(
    initialDocuments,
    initialHasNextPage,
    (nextPage) =>
      readDocumentsAction({ ...filters, page: nextPage }, projectIds),
    {
      additionalScrollDeps: [filters],
    },
  );

  return documents.length ? (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}

        {isPending &&
          Array.from({ length: 8 }).map((_, index) => (
            <DocumentSkeleton key={index} />
          ))}
      </div>
      <div ref={setSentinelEl} className="w-full h-1 bg-transparent" />
    </div>
  ) : (
    <InfoCard
      title="No documents found"
      description="We were unable to find any documents. Create one to get started or change your search filters."
      icon={<SearchXIcon />}
    />
  );
};
