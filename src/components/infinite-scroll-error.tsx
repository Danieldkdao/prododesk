"use client";

import { Button } from "@/components/ui/button";

export const InfiniteScrollError = ({
  error,
  retry,
}: {
  error: string | null;
  retry: () => void;
}) => {
  if (!error) return null;
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-2 py-3 text-sm text-muted-foreground"
    >
      <span>{error}</span>
      <Button type="button" variant="outline" size="sm" onClick={retry}>
        Try again
      </Button>
    </div>
  );
};
