import type { ToolSet } from "ai";

export const guardToolExecutions = <T extends ToolSet>(
  tools: T,
  shouldGuard: (name: string) => boolean,
  guard: (execute: () => Promise<unknown>) => Promise<unknown>,
): T =>
  Object.fromEntries(
    Object.entries(tools).map(([name, tool]) => {
      const execute = tool.execute;
      if (!execute || !shouldGuard(name)) return [name, tool];
      return [
        name,
        {
          ...tool,
          execute: (...args: Parameters<typeof execute>) =>
            guard(async () => execute(...args)),
        },
      ];
    }),
  ) as T;
