import { useCallback, useEffect, useRef } from "react";

type AsyncAction<Args extends unknown[], Result> = (
  ...args: Args
) => Promise<Result>;

export const useAbortableAction = <Args extends unknown[], Result>(
  action: AsyncAction<Args, Result>,
) => {
  const controllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const run = useCallback(
    (...args: Args): Promise<Result> => {
      abort();

      const controller = new AbortController();
      controllerRef.current = controller;

      return new Promise<Result>((resolve, reject) => {
        const handleAbort = () => {
          reject(
            controller.signal.reason ??
              new DOMException("Action aborted", "AbortError"),
          );
        };

        controller.signal.addEventListener("abort", handleAbort, {
          once: true,
        });

        action(...args).then(
          (result) => {
            controller.signal.removeEventListener("abort", handleAbort);

            if (!controller.signal.aborted) {
              resolve(result);
            }
          },
          (error) => {
            controller.signal.removeEventListener("abort", handleAbort);

            if (!controller.signal.aborted) {
              reject(error);
            }
          },
        );
      });
    },
    [action, abort],
  );

  useEffect(() => abort, [abort]);

  return {
    run,
    abort,
  };
};
