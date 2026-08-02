import { ErrorState } from "@/components/error-state";
import { SimpleEditor } from "@/components/tiptap/tiptap-templates/simple/simple-editor";
import { readDocumentAction } from "@/features/documents/actions/actions";
import { DocumentEditor } from "@/features/documents/components/document-editor";
import { ParamsId } from "@/lib/types";
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
  return <div>loading</div>;
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

  return <DocumentEditor document={document} />;
};

export default DocumentIdPage;
