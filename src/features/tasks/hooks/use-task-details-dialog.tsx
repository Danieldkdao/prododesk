"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type TaskDetailsDialogContextType = {
  taskId: string | null;
  openTaskDetails: (taskId: string) => void;
  closeTaskDetails: () => void;
};

const TaskDetailsDialogContext =
  createContext<TaskDetailsDialogContextType | null>(null);

export const TaskDetailsDialogProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [taskId, setTaskId] = useState<string | null>(null);

  useEffect(() => {
    const synchronizeTaskId = () => {
      const params = new URLSearchParams(window.location.search);
      setTaskId(params.get("taskId"));
    };

    synchronizeTaskId();

    window.addEventListener("popstate", synchronizeTaskId);

    return () => {
      window.removeEventListener("popstate", synchronizeTaskId);
    };
  }, []);

  const openTaskDetails = useCallback((taskId: string) => {
    setTaskId(taskId);

    const url = new URL(window.location.href);
    const dialogAlreadyOpen = url.searchParams.has("taskId");

    url.searchParams.set("taskId", taskId);

    const historyState = {
      ...(window.history.state ?? {}),
      taskDetailsDialog: true,
    };

    if (dialogAlreadyOpen) {
      window.history.replaceState(historyState, "", url);
    } else {
      window.history.pushState(historyState, "", url);
    }
  }, []);

  const closeTaskDetails = useCallback(() => {
    setTaskId(null);

    if (window.history.state?.taskDetailsDialog === true) {
      window.history.back();
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete("taskId");

    window.history.replaceState(
      { ...(window.history.state ?? {}), taskDetailsDialog: false },
      "",
      url,
    );
  }, []);

  const value = useMemo(
    () => ({ taskId, openTaskDetails, closeTaskDetails }),
    [taskId, openTaskDetails, closeTaskDetails],
  );

  return (
    <TaskDetailsDialogContext.Provider value={value}>
      {children}
    </TaskDetailsDialogContext.Provider>
  );
};

export const useTaskDetailsDialog = () => {
  const context = useContext(TaskDetailsDialogContext);
  if (!context)
    throw new Error(
      "Task details dialog context must be used inside the task details dialog context provider.",
    );

  return context;
};
