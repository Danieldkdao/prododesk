"use client";

import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useDebouncedCallback } from "@tanstack/react-pacer";
import { cn } from "@/lib/utils";

export const SearchInput = ({
  initialSearch,
  onValueChange,
  placeholder,
  className,
}: {
  initialSearch: string;
  onValueChange: (search: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (search: string) => {
    onValueChange(search);
  };
  const handleDebouncedSearch = useDebouncedCallback(handleSearch, {
    wait: 250,
  });

  return (
    <div className="flex items-center gap-2 w-full border pl-1.5 has-focus-visible:border-primary transition-all duration-300">
      <SearchIcon className="text-muted-foreground size-6 shrink-0" />
      <Input
        value={search}
        onChange={(e) => {
          const newValue = e.target.value;
          setSearch(newValue);
          handleDebouncedSearch(newValue);
        }}
        placeholder={placeholder}
        className={cn(
          "border-none ring-0 focus-visible:ring-0 focus-visible:outline-0 focus-visible:border-none shadow-none text-lg md:text-lg",
          className,
        )}
      />
    </div>
  );
};
