import { create } from "zustand";

type DialogStateStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  search: string;
  setSearch: (search: string) => void;
};

// todo: support multiple dialog states

export const useDialogStateStore = create<DialogStateStore>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  search: "",
  setSearch: (search) => set({ search }),
}));
