"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchInput } from "@/features/tasks/components/search-input";
import { FilterIcon, PlusIcon } from "lucide-react";
import { useDocumentsParams } from "../hooks/use-documents-params";
import {
  DocumentsSortByOption,
  documentsSortByOptions,
} from "../lib/documents-params";
import { formatDocumentSortByOption } from "../lib/formatters";
import { CreateDocumentButton } from "./create-document-button";

export const DocumentsFilters = ({ projectId }: { projectId?: string }) => {
  const [filters, setFilters] = useDocumentsParams();

  return (
    <div className="flex items-center gap-2">
      <SearchInput
        initialSearch={filters.search}
        onValueChange={(search) => setFilters({ search })}
        placeholder="Search by name, description, or project name"
      />
      <Popover>
        <PopoverTrigger
          render={
            <Button variant="outline" size="icon">
              <FilterIcon />
            </Button>
          }
        />
        <PopoverContent className="border" align="end">
          <div className="flex flex-col gap-2">
            <span className="font-medium">Sort By</span>
            <Select
              value={filters.sortBy}
              onValueChange={(value) =>
                setFilters({
                  sortBy: value as DocumentsSortByOption,
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort by">
                  {formatDocumentSortByOption(filters.sortBy)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {documentsSortByOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {formatDocumentSortByOption(option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PopoverContent>
      </Popover>
      {projectId && (
        <CreateDocumentButton projectId={projectId} size="icon">
          <PlusIcon />
        </CreateDocumentButton>
      )}
    </div>
  );
};
