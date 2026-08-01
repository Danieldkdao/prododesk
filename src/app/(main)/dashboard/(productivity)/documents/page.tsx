import { ErrorState } from "@/components/error-state";
import { InfoCard } from "@/components/info-card";
import { TooltipWrapper } from "@/components/tooltip-wrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { readDocumentsAction } from "@/features/documents/actions/actions";
import { CreateDocumentButton } from "@/features/documents/components/create-document-button";
import { DocumentCard } from "@/features/documents/components/document-card";
import { formatColor } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import {
  EllipsisIcon,
  FileTextIcon,
  FolderKanbanIcon,
  PlusIcon,
} from "lucide-react";
import Link from "next/link";
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
  return <div>loading</div>;
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
