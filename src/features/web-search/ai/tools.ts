import { tool } from "ai";
import {
  scrapeWebpageToolSchema,
  scrapeWebpageToolValidationSchema,
  searchWebToolSchema,
  searchWebToolValidationSchema,
} from "./schemas";
import { getCurrentUser } from "@/lib/auth/helpers";
import { envServer } from "@/data/env/server";
import removeMd from "remove-markdown";

export const searchWebTool = tool({
  description: "Searches the web and returns search results.",
  inputSchema: searchWebToolSchema,
  execute: async ({ query }, { abortSignal }) => {
    const userId = await getCurrentUser();
    if (!userId)
      throw new Error(
        "This user is not authenticated. Tell them they need to sign in first.",
      );

    const response = await fetch(
      "https://ai.hackclub.com/proxy/v1/exa/search",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${envServer.HACK_CLUB_AI_API_KEY}`,
        },
        body: JSON.stringify({ query, numResults: 5 }),
        signal: abortSignal,
      },
    );
    const unparsedData = await response.json();
    const { data, success } =
      searchWebToolValidationSchema.safeParse(unparsedData);
    if (!success) throw new Error("Invalid response data. Please try again.");

    return data.results
      .map(
        (result) => `
      ID: ${result.id}
      TITLE: ${result.title}
      URL: ${result.url}\n\n
      `,
      )
      .join("");
  },
});

export const scrapeWebpageTool = tool({
  description: "Scrapes given webpage and returns clean information.",
  inputSchema: scrapeWebpageToolSchema,
  execute: async ({ url }, { abortSignal }) => {
    const userId = await getCurrentUser();
    if (!userId)
      throw new Error(
        "This user is not authenticated. Tell them they need to sign in first.",
      );

    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${envServer.FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: [{ type: "markdown" }],
        onlyMainContent: true,
        minAge: 123,
        waitFor: 0,
        skipTlsVerification: true,
        parsers: ["pdf"],
        actions: [{ type: "wait", milliseconds: 2 }],
        location: { country: "US", languages: ["en-US"] },
        removeBase64Images: true,
        blockAds: true,
        proxy: "auto",
        storeInCache: true,
        lockdown: false,
        redactPII: false,
        zeroDataRetention: false,
      }),
      signal: abortSignal,
    });
    const unparsedData = await response.json();
    const { data, success } =
      scrapeWebpageToolValidationSchema.safeParse(unparsedData);
    if (!success) throw new Error("Invalid response data. Please try again.");

    const normalText = removeMd(data.data.markdown);

    return normalText;
  },
});

export const webSearchTools = {
  searchWeb: searchWebTool,
  scrapeWebpage: scrapeWebpageTool,
};
