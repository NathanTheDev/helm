import { z } from "zod";

export const createObsidianConnectionSchema = z.object({
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
});
