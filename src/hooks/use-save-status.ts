import { useState, useTransition } from "react";

type SaveStatus = "saved" | "error";

export const useSaveStatus = () => {
  const [savePending, startSave] = useTransition();
  const [saveStatus, setSaveStatus] = useState<SaveStatus | null>(null);

  return {
    savePending,
    startSave,
    saveStatus,
    setSaveStatus,
  };
};
