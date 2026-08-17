import z from "zod";

export const searchWebToolSchema = z.object({
  query: z
    .string()
    .min(1)
    .max(400, { error: "Query cannot be longer than 400 characters." })
    .superRefine((query, ctx) => {
      if (query.split(" ").length > 50) {
        ctx.addIssue({
          code: "custom",
          path: ["query"],
          message: "Query cannot be longer than 50 words.",
        });
      }
    })
    .describe("The search query. No more than 400 characters and 50 words."),
});
export const searchWebToolValidationSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      url: z.url(),
      publishedDate: z.string().optional(),
      image: z.string().optional(),
      favicon: z.string().optional(),
    }),
  ),
});

export const scrapeWebpageToolSchema = z.object({
  url: z
    .url({ protocol: /^https$/ })
    .describe(
      "The URL of the webpage you would like to scrape. Must start with 'https://'",
    ),
});
export const scrapeWebpageToolValidationSchema = z.object({
  success: z.boolean(),
  data: z.object({
    markdown: z.string(),
  }),
});
