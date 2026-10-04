import type { ChatRunStatus } from "@/db/shared";

export const CHAT_GENERATION_TIMEOUT_MS = 120_000;
export const CHAT_RUN_LEASE_MS = CHAT_GENERATION_TIMEOUT_MS + 30_000;
export const ACTIVE_CHAT_RUN_STATUSES: ChatRunStatus[] = [
  "pending",
  "streaming",
  "running-tool",
];

export const canClaimChatRun = (
  run: { status: ChatRunStatus; startedAt: Date | null },
  options: { isNew: boolean; isRegenerating: boolean; now: Date },
) => {
  if (options.isNew) return run.status === "pending";
  if (ACTIVE_CHAT_RUN_STATUSES.includes(run.status)) {
    return (
      !run.startedAt ||
      options.now.getTime() - run.startedAt.getTime() >= CHAT_RUN_LEASE_MS
    );
  }
  if (run.status === "completed") return options.isRegenerating;
  return ["failed", "cancelled", "awaiting-approval"].includes(run.status);
};

export const nextAttemptStartedAt = (previous: Date | null, now: Date) =>
  new Date(Math.max(now.getTime(), (previous?.getTime() ?? 0) + 1));
