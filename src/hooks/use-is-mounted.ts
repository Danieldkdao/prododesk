import { useSyncExternalStore } from "react"

export const useIsMounted = () => {
  const subscribe = () => {
    return () => { };
  };

  return useSyncExternalStore(subscribe, () => true, () => false);
}
