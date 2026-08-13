import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { DocumentSelectType } from "@/db/schema";
import { FileIcon } from "lucide-react";
import { format } from "date-fns";

export const OverviewDocumentsTable = ({
  documents,
}: {
  documents: DocumentSelectType[];
}) => {
  return (
    <Table>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <FileIcon className="size-5" />
                <span className="text-base font-medium">{document.name}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-base text-right">
              Updated {format(document.updatedAt, "PP p")}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
