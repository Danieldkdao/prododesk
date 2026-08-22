"use client";

import { CommandIcon, SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Kbd } from "./ui/kbd";
import { useEffect, useState } from "react";
import { SearchCommandModal } from "./search-command-modal";

export const WorkspaceSearch = () => {
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "k" &&
        (e.metaKey || e.ctrlKey) &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <SearchCommandModal open={searchModalOpen} setOpen={setSearchModalOpen} />
      <InputGroup
        className="border-border! px-2 flex items-center justify-center cursor-pointer w-full flex-1 max-w-180"
        onClick={() => setSearchModalOpen(true)}
      >
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Search workspace..."
          disabled
          className="disabled:opacity-100! disabled:text-muted-foreground! disabled:placeholder:text-muted-foreground!"
        />
        <InputGroupAddon align="inline-end">
          <Kbd>
            <CommandIcon />K
          </Kbd>
        </InputGroupAddon>
      </InputGroup>
    </>
  );
};
