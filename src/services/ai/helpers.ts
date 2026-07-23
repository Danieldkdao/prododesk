import { ModelMessage } from "ai";

export const COMPACT_AFTER_TOKENS = 55_000;

export const estimateTokens = (messages: ModelMessage[]) => {
  return JSON.stringify(messages).length / 4;
};
