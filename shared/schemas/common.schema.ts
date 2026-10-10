import { z } from "zod";

/** Supported content languages. */
export const LangSchema = z.enum(["ar", "en"]);

export type LangCode = z.infer<typeof LangSchema>;

/** One string per language. */
export const BilingualTextSchema = z.object({
  ar: z.string(),
  en: z.string(),
});

export type BilingualText = z.infer<typeof BilingualTextSchema>;
