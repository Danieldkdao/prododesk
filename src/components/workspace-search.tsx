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
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchModalOpen(true);
      }
    };

    window.addEventListener("keydown", (e) => handleKeyDown(e));

    return () => {
      window.removeEventListener("keydown", (e) => handleKeyDown(e));
    };
  }, []);

  return (
    <>
      <SearchCommandModal open={searchModalOpen} setOpen={setSearchModalOpen} />
      <InputGroup
        className="border-border! px-2 flex items-center justify-center cursor-pointer"
        onClick={() => setSearchModalOpen(true)}
      >
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search workspace..." />
        <InputGroupAddon align="inline-end">
          <Kbd>
            <CommandIcon />K
          </Kbd>
        </InputGroupAddon>
      </InputGroup>
    </>
  );
};
