"use client";

import { CommandIcon, SearchIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "./ui/input-group";
import { Kbd } from "./ui/kbd";

export const WorkspaceSearch = () => {
  return (
    <InputGroup className="border-border! px-2 flex items-center justify-center">
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
  );
};
