"use client";

import { SearchInput } from "@/features/tasks/components/search-input";
import { useDocumentsParams } from "../hooks/use-documents-params";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { FilterIcon, PlusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DocumentsSortByOption,
  documentsSortByOptions,
} from "../lib/documents-params";
import { formatDocumentSortByOption } from "../lib/formatters";
import { CreateDocumentButton } from "./create-document-button";
import { TooltipWrapper } from "@/components/tooltip-wrapper";

export const DocumentsFilters = ({ projectId }: { projectId: string }) => {
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
      <TooltipWrapper content="New Document">
        <CreateDocumentButton projectId={projectId} size="icon">
          <PlusIcon />
        </CreateDocumentButton>
      </TooltipWrapper>
    </div>
  );
};
